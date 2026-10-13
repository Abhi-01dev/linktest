package com.linktest;

import com.linktest.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.sql.Connection;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class DatabaseHealthTest {

    private static final Logger log = LoggerFactory.getLogger(DatabaseHealthTest.class);

    @Autowired
    private DataSource dataSource;

    @Autowired
    private UserRepository userRepository;

    @Test
    void testDatabaseConnectionAndUserCount() throws Exception {
        assertNotNull(dataSource, "DataSource bean should not be null");

        try (Connection connection = dataSource.getConnection()) {
            assertNotNull(connection, "Database connection should be established");
            assertTrue(connection.isValid(5), "Connection to PostgreSQL should be valid");
            log.info("Successfully connected to database product: {} {}",
                    connection.getMetaData().getDatabaseProductName(),
                    connection.getMetaData().getDatabaseProductVersion());
        }

        long userCount = userRepository.count();
        log.info("Verified active user count in Neon PostgreSQL: {}", userCount);
        assertTrue(userCount > 0, "User repository count should be greater than zero");
    }
}
