package com.antiphishing.poi.service;

public interface TtsService {
    byte[] synthesize(String lang, String text);
}
