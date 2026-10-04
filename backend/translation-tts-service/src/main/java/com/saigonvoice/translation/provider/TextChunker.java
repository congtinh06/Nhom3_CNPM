package com.saigonvoice.translation.provider;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Splits text into chunks respecting byte limits and preserving sentence/word boundaries.
 *
 * Official MyMemory documentation references:
 * 1. Per-request limit: 'q' parameter is limited to max 500 bytes (UTF-8).
 *    Source: https://mymemory.translated.net/doc/spec.php (Section "Get", Parameter table for 'q')
 * 2. Daily character quotas:
 *    - Free, anonymous: 5,000 chars/day
 *    - Valid email ('de' parameter): 50,000 chars/day
 *    - Whitelisted CAT tools: 150,000 chars/day
 *    Source: https://mymemory.translated.net/doc/usagelimits.php (Section "Get")
 */
public final class TextChunker {

    private TextChunker() {
    }

    public static List<String> split(String text, int maxBytes) {
        if (text == null) {
            return List.of();
        }
        String trimmed = text.trim();
        if (trimmed.isEmpty()) {
            return List.of();
        }
        if (maxBytes <= 0) {
            throw new IllegalArgumentException("maxBytes must be positive: " + maxBytes);
        }
        if (trimmed.getBytes(StandardCharsets.UTF_8).length <= maxBytes) {
            return List.of(trimmed);
        }

        List<String> chunks = new ArrayList<>();
        String[] paragraphs = trimmed.split("\n+");
        StringBuilder currentChunk = new StringBuilder();

        for (String paragraph : paragraphs) {
            String p = paragraph.trim();
            if (p.isEmpty()) {
                continue;
            }

            if (p.getBytes(StandardCharsets.UTF_8).length <= maxBytes) {
                appendOrFlush(chunks, currentChunk, p, maxBytes);
            } else {
                List<String> sentences = splitIntoSentences(p);
                for (String sentence : sentences) {
                    if (sentence.getBytes(StandardCharsets.UTF_8).length <= maxBytes) {
                        appendOrFlush(chunks, currentChunk, sentence, maxBytes);
                    } else {
                        List<String> words = splitIntoWords(sentence);
                        for (String word : words) {
                            if (word.getBytes(StandardCharsets.UTF_8).length <= maxBytes) {
                                appendOrFlush(chunks, currentChunk, word, maxBytes);
                            } else {
                                if (currentChunk.length() > 0) {
                                    chunks.add(currentChunk.toString().trim());
                                    currentChunk.setLength(0);
                                }
                                chunks.addAll(hardSlice(word, maxBytes));
                            }
                        }
                    }
                }
            }
        }

        if (currentChunk.length() > 0) {
            chunks.add(currentChunk.toString().trim());
        }

        return chunks;
    }

    private static void appendOrFlush(List<String> chunks, StringBuilder current, String piece, int maxBytes) {
        if (current.length() == 0) {
            current.append(piece);
            return;
        }

        String candidate = current + " " + piece;
        if (candidate.getBytes(StandardCharsets.UTF_8).length <= maxBytes) {
            current.append(" ").append(piece);
        } else {
            chunks.add(current.toString().trim());
            current.setLength(0);
            current.append(piece);
        }
    }

    private static List<String> splitIntoSentences(String text) {
        String[] raw = text.split("(?<=[.!?])\\s+");
        List<String> list = new ArrayList<>();
        for (String s : raw) {
            String t = s.trim();
            if (!t.isEmpty()) {
                list.add(t);
            }
        }
        return list;
    }

    private static List<String> splitIntoWords(String text) {
        String[] raw = text.split("\\s+");
        List<String> list = new ArrayList<>();
        for (String w : raw) {
            String t = w.trim();
            if (!t.isEmpty()) {
                list.add(t);
            }
        }
        return list;
    }

    private static List<String> hardSlice(String text, int maxBytes) {
        List<String> result = new ArrayList<>();
        byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
        int offset = 0;
        while (offset < bytes.length) {
            int length = Math.min(maxBytes, bytes.length - offset);
            while (length > 0 && (bytes[offset + length - 1] & 0xC0) == 0x80) {
                int charStart = offset + length - 1;
                while (charStart >= offset && (bytes[charStart] & 0xC0) == 0x80) {
                    charStart--;
                }
                if (charStart >= offset) {
                    int expectedBytes = getUtf8CharLength(bytes[charStart]);
                    if (charStart + expectedBytes <= offset + length) {
                        break;
                    } else {
                        length = charStart - offset;
                        break;
                    }
                } else {
                    length--;
                }
            }
            if (length <= 0) {
                length = 1;
            }
            result.add(new String(bytes, offset, length, StandardCharsets.UTF_8));
            offset += length;
        }
        return result;
    }

    private static int getUtf8CharLength(byte b) {
        if ((b & 0x80) == 0) return 1;
        if ((b & 0xE0) == 0xC0) return 2;
        if ((b & 0xF0) == 0xE0) return 3;
        if ((b & 0xF8) == 0xF0) return 4;
        return 1;
    }
}
