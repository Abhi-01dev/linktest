package com.linktest.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.linktest.dto.ApiError;
import com.linktest.entity.User;
import com.linktest.repository.UserRepository;
import com.linktest.service.LoggingService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final LoggingService loggingService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, UserRepository userRepository, LoggingService loggingService) {
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.loggingService = loggingService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String token = resolveToken(request);

        if (StringUtils.hasText(token) && tokenProvider.validateToken(token)) {
            String userId = tokenProvider.getUserIdFromToken(token);
            Optional<User> userOpt = userRepository.findById(userId);

            if (userOpt.isPresent()) {
                User user = userOpt.get();

                if ("suspended".equalsIgnoreCase(user.getStatus())) {
                    loggingService.logSecurity(
                            "SUSPENDED_ACCOUNT_ACCESS_ATTEMPT",
                            "HIGH",
                            user.getId(),
                            user.getEmail(),
                            request.getRemoteAddr(),
                            request.getHeader("User-Agent"),
                            "Suspended user attempted to access " + request.getMethod() + " " + request.getRequestURI(),
                            "{}"
                    );
                    sendErrorResponse(response, HttpServletResponse.SC_FORBIDDEN, "ACCOUNT_SUSPENDED", "Your account has been suspended. Please contact an administrator.");
                    return;
                }

                if ("deactivated".equalsIgnoreCase(user.getStatus())) {
                    loggingService.logSecurity(
                            "DEACTIVATED_ACCOUNT_ACCESS_ATTEMPT",
                            "HIGH",
                            user.getId(),
                            user.getEmail(),
                            request.getRemoteAddr(),
                            request.getHeader("User-Agent"),
                            "Deactivated user attempted to access " + request.getMethod() + " " + request.getRequestURI(),
                            "{}"
                    );
                    sendErrorResponse(response, HttpServletResponse.SC_FORBIDDEN, "ACCOUNT_DEACTIVATED", "This account has been deactivated.");
                    return;
                }

                UserPrincipal principal = new UserPrincipal(user);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private void sendErrorResponse(HttpServletResponse response, int status, String code, String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ApiError apiError = new ApiError(code, message);
        response.getWriter().write(objectMapper.writeValueAsString(apiError));
    }
}
