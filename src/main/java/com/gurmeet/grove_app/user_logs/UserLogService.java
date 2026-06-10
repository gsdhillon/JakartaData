package com.gurmeet.grove_app.user_logs;

import com.gurmeet.grove_app.security.AuthUser;
import com.gurmeet.grove_app.security.UserAccessPolicy;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.json.bind.Jsonb;
import jakarta.json.bind.JsonbBuilder;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.ForbiddenException;

import java.time.Instant;
import java.util.Map;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@ApplicationScoped
public class UserLogService {

    @PersistenceContext(unitName = "personPU")
    private EntityManager entityManager;

    public UserLogService() {
    }

    @Transactional
    public String recordLogin(AuthUser user, String ip) {
        String sessionId = UUID.randomUUID().toString();
        UserLogin login = new UserLogin();

        login.setSessionId(sessionId);
        login.setUserId(user.getId());
        login.setRole(user.getRole());
        login.setLoginAt(Instant.now());
        login.setIp(cleanIp(ip));
        entityManager.persist(login);

        return sessionId;
    }

    @Transactional
    public void recordLogout(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return;
        }

        UserLogin login = entityManager.find(UserLogin.class, sessionId);

        if (login != null && login.getLogoutAt() == null) {
            login.setLogoutAt(Instant.now());
        }
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void recordError(List<String> errors) {
        RestRequestContext.RestRequest request = RestRequestContext.get();

        if (request == null) {
            return;
        }

        UserError error = new UserError();

        error.setSessionId(request.sessionId());
        error.setReq(request.req());
        error.setMethod(request.method());
        error.setError(toJson(errors));
        error.setCreatedAt(Instant.now());
        entityManager.persist(error);
    }

    public List<UserLoginDto> findLogins(AuthUser actor) {
        Instant since = Instant.now().minusSeconds(24 * 60 * 60);
        boolean viewAll = canViewAllLogs(actor);
        List<UserLogin> logins = viewAll
                ? entityManager
                        .createQuery("""
                                select l
                                from UserLogin l
                                where l.loginAt >= :since
                                order by l.loginAt desc
                                """, UserLogin.class)
                        .setParameter("since", since)
                        .getResultList()
                : entityManager
                        .createQuery("""
                                select l
                                from UserLogin l
                                where l.loginAt >= :since
                                and l.userId = :userId
                                order by l.loginAt desc
                                """, UserLogin.class)
                        .setParameter("since", since)
                        .setParameter("userId", actor.getId())
                        .getResultList();
        Map<String, Long> errorCounts = errorCounts(logins);

        return logins
                .stream()
                .map(login -> new UserLoginDto(login, errorCounts.getOrDefault(login.getSessionId(), 0L)))
                .toList();
    }

    public List<UserErrorDto> findErrors(AuthUser actor, String sessionId) {
        UserLogin login = entityManager.find(UserLogin.class, sessionId);

        if (login == null || (!canViewAllLogs(actor) && !String.valueOf(actor.getId()).equals(login.getUserId()))) {
            throw new ForbiddenException("You are not allowed to view these logs.");
        }

        return entityManager
                .createQuery("""
                        select e
                        from UserError e
                        where e.sessionId = :sessionId
                        order by e.createdAt desc
                        """, UserError.class)
                .setParameter("sessionId", sessionId)
                .getResultList()
                .stream()
                .map(error -> new UserErrorDto(error, login.getUserId()))
                .toList();
    }

    private Map<String, Long> errorCounts(List<UserLogin> logins) {
        List<String> sessionIds = logins
                .stream()
                .map(UserLogin::getSessionId)
                .toList();

        if (sessionIds.isEmpty()) {
            return Map.of();
        }

        return entityManager
                .createQuery("""
                        select e.sessionId, count(e)
                        from UserError e
                        where e.sessionId in :sessionIds
                        group by e.sessionId
                        """, Object[].class)
                .setParameter("sessionIds", sessionIds)
                .getResultList()
                .stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> ((Number) row[1]).longValue()
                ));
    }

    private boolean canViewAllLogs(AuthUser actor) {
        String role = UserAccessPolicy.normalizeRole(actor == null ? null : actor.getRole());

        return UserAccessPolicy.SUPER_ADMIN.equals(role) || UserAccessPolicy.ADMIN.equals(role);
    }

    private String toJson(List<String> errors) {
        try (Jsonb jsonb = JsonbBuilder.create()) {
            return jsonb.toJson(errors);
        } catch (Exception exception) {
            return "[\"Unable to serialize error response.\"]";
        }
    }

    private String cleanIp(String ip) {
        if (ip == null || ip.isBlank()) {
            return null;
        }

        return ip.length() > 100
                ? ip.substring(0, 100)
                : ip;
    }
}
