using System;
using System.Collections.Generic;
using Xunit;
using OrbitieLogParser.Services; 
using OrbitieLogApi.Models;      

namespace OrbitieLogParser.Tests
{
    public class LogParserServiceTests
    {
        private readonly LogParserService _service;

        public LogParserServiceTests()
        {
            _service = new LogParserService();
        }

        [Theory]
        [InlineData("2026-06-22 10:15:30.000 +03:00 [Error] DatabaseModule - Connection failed", "Error", "DatabaseModule", "Connection failed")]
        [InlineData("2026-06-22 10:16:00.123 +00:00 [Info] AuthModule - User logged in", "Info", "AuthModule", "User logged in")]
        [InlineData("2026-06-22 10:17:15.999 -04:00 [Warning] NetworkModule - High latency detected", "Warning", "NetworkModule", "High latency detected")]
        public void ParseLogs_DifferentLogLevels_ParsesCorrectly(string logLine, string expectedLevel, string expectedModule, string expectedMessage)
        {
            string[] logLines = { logLine };

            var result = _service.ParseLogs(logLines);

            Assert.NotNull(result);
            Assert.Single(result);

            var entry = result[0];
            Assert.Equal(expectedLevel, entry.LogLevel);
            Assert.Equal(expectedModule, entry.SourceContext);
            Assert.Equal(expectedMessage, entry.Message);
            Assert.True(string.IsNullOrWhiteSpace(entry.Exception));
        }

        [Fact]
        public void ParseLogs_MultiLineLogWithException_AppendsToPreviousEntry()
        {
            string[] logLines = {
                "2026-06-22 10:15:30.000 +03:00 [Error] DatabaseModule - Connection failed",
                "System.Data.SqlClient.SqlException: Timeout expired.",
                "   at OrbitieLogParser.Data.Connection.Open()",
                "   at OrbitieLogParser.Services.LogParserService.GetData()",
                "2026-06-22 10:16:00.000 +03:00 [Info] AuthModule - User logged in"
            };

            var result = _service.ParseLogs(logLines);

            Assert.NotNull(result);
            Assert.Equal(2, result.Count);

            var errorEntry = result[0];
            Assert.Equal("DatabaseModule", errorEntry.SourceContext);
            Assert.Equal("Connection failed", errorEntry.Message);
            Assert.NotNull(errorEntry.Exception);
            Assert.Contains("System.Data.SqlClient.SqlException: Timeout expired.", errorEntry.Exception);
            Assert.Contains("at OrbitieLogParser.Services.LogParserService.GetData()", errorEntry.Exception);

            var infoEntry = result[1];
            Assert.Equal("AuthModule", infoEntry.SourceContext);
            Assert.True(string.IsNullOrWhiteSpace(infoEntry.Exception));
        }

        [Fact]
        public void ParseLogs_OrphanStackTraceAtFirstLine_HandlesGracefullyWithoutCrashing()
        {
            string[] logLines = {
                "   at OrbitieLogParser.Program.Main()",
                "2026-06-22 10:15:30.000 +03:00 [Info] SystemModule - Normal start"
            };

            // Act & Assert (Çökme olmadan okumalı)
            var exception = Record.Exception(() => _service.ParseLogs(logLines));
            Assert.Null(exception); 
            
            var result = _service.ParseLogs(logLines);
            Assert.NotNull(result);
            Assert.Single(result); 
            Assert.Equal("SystemModule", result[0].SourceContext);
        }

        [Fact]
        public void ParseLogs_EmptyOrInvalidLines_HandlesGracefullyWithoutCrashing()
        {
            string?[] logLines = {
                "",
                "   ",
                "Corrupted log line without date stamp",
                null
            };

            var exception = Record.Exception(() => _service.ParseLogs(logLines!));

            Assert.Null(exception); 
            var result = _service.ParseLogs(logLines!);
            Assert.Empty(result);
        }

        [Fact]
        public void ParseLogs_NullArray_ReturnsEmptyList()
        {
            string[]? logLines = null;

            var result = _service.ParseLogs(logLines!);

            Assert.NotNull(result);
            Assert.Empty(result);
        }
    }
}