package com.saigonvoice.content.service;

public interface TtsService {
    byte[] synthesize(String lang, String text);
}
