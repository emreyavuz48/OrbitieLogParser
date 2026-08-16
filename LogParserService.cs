using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using OrbitieLogApi.Models;

namespace OrbitieLogParser.Services
{
    public class LogParserService
    {
        private readonly Regex _logPattern = new Regex(
            @"^(?<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} [+\-]\d{2}:\d{2})\s+" +
            @"\[(?<level>\w+)\]\s+" +
            @"(?<message>.*?)(?=\s+Exception:|$)",
            RegexOptions.Compiled | RegexOptions.Singleline
        );

        public List<Log> ParseLogs(string[] logLines)
        {
            var entries = new List<Log>();
            if (logLines == null || logLines.Length == 0)
                return entries;

            Log? currentEntry = null;
            var exceptionLines = new List<string>();
            bool isExceptionBlock = false;

            foreach (var line in logLines)
            {
                if (string.IsNullOrWhiteSpace(line))
                    continue;

                var match = _logPattern.Match(line);
                if (match.Success)
                {
                    // Önceki entry'yi kaydet
                    if (currentEntry != null)
                    {
                        if (exceptionLines.Count > 0)
                        {
                            currentEntry.Exception = string.Join(Environment.NewLine, exceptionLines);
                        }
                        entries.Add(currentEntry);
                    }

                    var timestamp = DateTimeOffset.Parse(match.Groups["timestamp"].Value);
                    var level = match.Groups["level"].Value;
                    var message = match.Groups["message"].Value.Trim();

                    currentEntry = new Log
                    {
                        Timestamp = timestamp,
                        LogLevel = level,
                        Message = message,
                        SourceContext = null,
                        Exception = null
                    };

                    exceptionLines.Clear();
                    isExceptionBlock = false;

                    var contextMatch = Regex.Match(message, @"^(?<context>[A-Za-z0-9_\-=>]+)\s*-?\s*");
                    if (contextMatch.Success)
                    {
                        currentEntry.SourceContext = contextMatch.Groups["context"].Value;
                        currentEntry.Message = message.Substring(contextMatch.Length).Trim();
                    }
                }
                else
                {
                    if (currentEntry != null)
                    {
                        isExceptionBlock = true;
                        exceptionLines.Add(line.Trim());
                    }
                    else
                    {
                       
                    }
                }
            }

            if (currentEntry != null)
            {
                if (exceptionLines.Count > 0)
                {
                    currentEntry.Exception = string.Join(Environment.NewLine, exceptionLines);
                }
                entries.Add(currentEntry);
            }

            return entries;
        }
    }
}