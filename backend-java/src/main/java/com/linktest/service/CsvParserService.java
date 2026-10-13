package com.linktest.service;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.StringReader;
import java.util.*;

@Service
public class CsvParserService {

    /**
     * Parses an RFC 4180 compliant CSV string into a list of Maps (header -> value).
     * Handles multiline fields, commas inside quotes, escaped quotes (""), and UTF-8 BOM.
     */
    public List<Map<String, String>> parseCsv(String csvContent) throws IOException {
        if (csvContent == null || csvContent.isBlank()) {
            return Collections.emptyList();
        }

        // Strip UTF-8 BOM if present
        if (csvContent.startsWith("\uFEFF")) {
            csvContent = csvContent.substring(1);
        }

        List<List<String>> records = parseRawCsv(csvContent);
        if (records.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> rawHeaders = records.get(0);
        List<String> headers = new ArrayList<>();
        for (String h : rawHeaders) {
            headers.add(h != null ? h.trim() : "");
        }

        List<Map<String, String>> result = new ArrayList<>();
        for (int i = 1; i < records.size(); i++) {
            List<String> row = records.get(i);
            // Skip entirely empty trailing rows
            boolean allEmpty = true;
            for (String col : row) {
                if (col != null && !col.trim().isEmpty()) {
                    allEmpty = false;
                    break;
                }
            }
            if (allEmpty) {
                continue;
            }

            Map<String, String> rowMap = new LinkedHashMap<>();
            for (int hIdx = 0; hIdx < headers.size(); hIdx++) {
                String header = headers.get(hIdx);
                String val = (hIdx < row.size() && row.get(hIdx) != null) ? row.get(hIdx).trim() : "";
                rowMap.put(header, val);
            }
            // Store original 1-based row number for user diagnostics
            rowMap.put("__rowNumber", String.valueOf(i + 1));
            result.add(rowMap);
        }

        return result;
    }

    private List<List<String>> parseRawCsv(String text) {
        List<List<String>> lines = new ArrayList<>();
        List<String> currentLine = new ArrayList<>();
        StringBuilder curField = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);

            if (inQuotes) {
                if (c == '"') {
                    if (i + 1 < text.length() && text.charAt(i + 1) == '"') {
                        // Escaped quote
                        curField.append('"');
                        i++;
                    } else {
                        // End of quote
                        inQuotes = false;
                    }
                } else {
                    curField.append(c);
                }
            } else {
                if (c == '"') {
                    inQuotes = true;
                } else if (c == ',') {
                    currentLine.add(curField.toString());
                    curField.setLength(0);
                } else if (c == '\r') {
                    if (i + 1 < text.length() && text.charAt(i + 1) == '\n') {
                        i++;
                    }
                    currentLine.add(curField.toString());
                    curField.setLength(0);
                    lines.add(new ArrayList<>(currentLine));
                    currentLine.clear();
                } else if (c == '\n') {
                    currentLine.add(curField.toString());
                    curField.setLength(0);
                    lines.add(new ArrayList<>(currentLine));
                    currentLine.clear();
                } else {
                    curField.append(c);
                }
            }
        }

        // Add final field and line if remaining
        if (curField.length() > 0 || !currentLine.isEmpty()) {
            currentLine.add(curField.toString());
            lines.add(currentLine);
        }

        return lines;
    }

    /**
     * Generates an RFC 4180 CSV string given headers and row maps.
     */
    public String generateCsv(List<String> headers, List<Map<String, Object>> rows) {
        StringBuilder sb = new StringBuilder();
        // Headers
        for (int i = 0; i < headers.size(); i++) {
            if (i > 0) sb.append(',');
            sb.append(escapeCsvField(headers.get(i)));
        }
        sb.append("\r\n");

        for (Map<String, Object> row : rows) {
            for (int i = 0; i < headers.size(); i++) {
                if (i > 0) sb.append(',');
                Object val = row.get(headers.get(i));
                sb.append(escapeCsvField(val != null ? val.toString() : ""));
            }
            sb.append("\r\n");
        }

        return sb.toString();
    }

    private String escapeCsvField(String field) {
        if (field == null) return "\"\"";
        boolean mustQuote = field.contains(",") || field.contains("\"") || field.contains("\n") || field.contains("\r");
        if (mustQuote) {
            return "\"" + field.replace("\"", "\"\"") + "\"";
        }
        return field;
    }
}
