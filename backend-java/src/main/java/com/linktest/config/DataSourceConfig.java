package com.linktest.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${DATABASE_URL:${spring.datasource.url:}}")
    private String databaseUrl;

    @Value("${DB_USERNAME:${spring.datasource.username:}}")
    private String fallbackUsername;

    @Value("${DB_PASSWORD:${spring.datasource.password:}}")
    private String fallbackPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setPoolName("LinkTest-HikariCP");
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);

        if (databaseUrl != null && !databaseUrl.isBlank()) {
            if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
                try {
                    // Normalize protocol for URI parser if postgres://
                    String cleanUrl = databaseUrl.replaceFirst("^postgres://", "http://").replaceFirst("^postgresql://", "http://");
                    URI uri = new URI(cleanUrl);

                    String host = uri.getHost();
                    int port = uri.getPort() != -1 ? uri.getPort() : 5432;
                    String path = uri.getPath();
                    String dbName = path != null && path.startsWith("/") ? path.substring(1) : path;
                    String query = uri.getQuery();

                    String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + dbName;
                    if (query != null && !query.isBlank()) {
                        jdbcUrl += "?" + query;
                    } else {
                        jdbcUrl += "?sslmode=require";
                    }

                    config.setJdbcUrl(jdbcUrl);

                    String userInfo = uri.getUserInfo();
                    if (userInfo != null && userInfo.contains(":")) {
                        String[] parts = userInfo.split(":", 2);
                        config.setUsername(parts[0]);
                        config.setPassword(parts[1]);
                    }

                    log.info("Configured PostgreSQL HikariDataSource for host: {} on port: {}", host, port);
                } catch (Exception e) {
                    log.error("Failed to parse DATABASE_URL URI, falling back to raw JDBC string: {}", e.getMessage());
                    config.setJdbcUrl(databaseUrl.startsWith("jdbc:") ? databaseUrl : "jdbc:" + databaseUrl);
                    if (fallbackUsername != null && !fallbackUsername.isBlank()) {
                        config.setUsername(fallbackUsername);
                    }
                    if (fallbackPassword != null && !fallbackPassword.isBlank()) {
                        config.setPassword(fallbackPassword);
                    }
                }
            } else {
                config.setJdbcUrl(databaseUrl);
                if (fallbackUsername != null && !fallbackUsername.isBlank()) {
                    config.setUsername(fallbackUsername);
                }
                if (fallbackPassword != null && !fallbackPassword.isBlank()) {
                    config.setPassword(fallbackPassword);
                }
            }
        } else {
            // Default local fallback
            config.setJdbcUrl("jdbc:postgresql://localhost:5432/linktest");
            config.setUsername(fallbackUsername != null && !fallbackUsername.isBlank() ? fallbackUsername : "postgres");
            config.setPassword(fallbackPassword != null && !fallbackPassword.isBlank() ? fallbackPassword : "postgres");
        }

        config.setDriverClassName("org.postgresql.Driver");
        return new HikariDataSource(config);
    }
}
