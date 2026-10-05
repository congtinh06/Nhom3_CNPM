package com.saigonvoice.translation.config;

import com.saigonvoice.translation.listener.PoiEventListener;
import com.saigonvoice.translation.messaging.PoiAudioEventPublisher;
import com.saigonvoice.translation.provider.MyMemoryTranslationProvider;
import com.saigonvoice.translation.provider.SeedTranslationProvider;
import com.saigonvoice.translation.provider.TranslationProvider;
import com.saigonvoice.translation.repository.TranslationCacheRepository;
import com.saigonvoice.translation.repository.TranslationJobRepository;
import com.saigonvoice.translation.service.AudioStorageService;
import com.saigonvoice.translation.service.AudioStorageServiceImpl;
import com.saigonvoice.translation.service.PoiPipelineService;
import com.saigonvoice.translation.service.PoiPipelineServiceImpl;
import com.saigonvoice.translation.service.TranslationCacheService;
import com.saigonvoice.translation.service.TranslationCacheServiceImpl;
import com.saigonvoice.translation.service.TranslationGlossary;
import com.saigonvoice.translation.tts.SubtitleDurationParser;
import com.saigonvoice.translation.tts.TtsVoiceProvider;
import com.saigonvoice.translation.tts.runner.EdgeTtsRunner;
import com.saigonvoice.translation.tts.runner.ProcessCommandRunner;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.jackson.JacksonAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class TranslationWiringTest {

    private final ApplicationContextRunner providerRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(JacksonAutoConfiguration.class))
            .withUserConfiguration(
                    TranslationConfig.class,
                    SeedTranslationProvider.class,
                    MyMemoryTranslationProvider.class
            );

    @Test
    @DisplayName("provider=seed wires SeedTranslationProvider and no MyMemoryTranslationProvider exists")
    void testProviderSeed_wiresSeed_andNoMyMemoryBean() {
        providerRunner
                .withPropertyValues("app.translation.provider=seed")
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context.getBean("translationProvider")).isInstanceOf(SeedTranslationProvider.class);
                    assertThat(context.getBean(TranslationProvider.class)).isInstanceOf(SeedTranslationProvider.class);
                    assertThat(context).doesNotHaveBean(MyMemoryTranslationProvider.class);
                });
    }

    @Test
    @DisplayName("provider=mymemory wires MyMemoryTranslationProvider and no SeedTranslationProvider exists")
    void testProviderMyMemory_wiresMyMemory() {
        providerRunner
                .withPropertyValues(
                        "app.translation.provider=mymemory",
                        "app.translation.mymemory.email=dummy@example.com"
                )
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context.getBean("translationProvider")).isInstanceOf(MyMemoryTranslationProvider.class);
                    assertThat(context.getBean(TranslationProvider.class)).isInstanceOf(MyMemoryTranslationProvider.class);
                    assertThat(context).doesNotHaveBean(SeedTranslationProvider.class);
                });
    }

    @Test
    @DisplayName("missing provider value fails with clear error message naming app.translation.provider")
    void testMissingProvider_failsWithClearErrorMessage() {
        providerRunner
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(context.getStartupFailure()).hasRootCauseInstanceOf(IllegalArgumentException.class);
                    assertThat(context.getStartupFailure().getMessage())
                            .contains("Unknown app.translation.provider: ''. Supported values are 'seed' and 'mymemory'.");
                });
    }

    @Test
    @DisplayName("invalid provider value fails with clear error message naming app.translation.provider")
    void testInvalidProvider_failsWithClearErrorMessage() {
        providerRunner
                .withPropertyValues("app.translation.provider=google_translate")
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(context.getStartupFailure()).hasRootCauseInstanceOf(IllegalArgumentException.class);
                    assertThat(context.getStartupFailure().getMessage())
                            .contains("Unknown app.translation.provider: 'google_translate'. Supported values are 'seed' and 'mymemory'.");
                });
    }

    @Test
    @DisplayName("Loads real application wiring for pipeline beans without DB/RabbitMQ")
    void testPipelineBeanGraphWiring_withoutDbAndRabbit() {
        new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(JacksonAutoConfiguration.class))
                .withUserConfiguration(
                        TranslationConfig.class,
                        SeedTranslationProvider.class,
                        MyMemoryTranslationProvider.class,
                        TranslationGlossary.class,
                        TranslationCacheServiceImpl.class,
                        TtsVoiceProvider.class,
                        SubtitleDurationParser.class,
                        ProcessCommandRunner.class,
                        EdgeTtsRunner.class,
                        AudioStorageServiceImpl.class,
                        PoiAudioEventPublisher.class,
                        PoiPipelineServiceImpl.class,
                        PoiEventListener.class
                )
                .withBean(TranslationJobRepository.class, () -> mock(TranslationJobRepository.class))
                .withBean(TranslationCacheRepository.class, () -> mock(TranslationCacheRepository.class))
                .withBean(RabbitTemplate.class, () -> mock(RabbitTemplate.class))
                .withPropertyValues(
                        "app.translation.provider=seed",
                        "app.audio.storage-dir=/tmp/audio",
                        "app.audio.public-base-url=http://localhost:8083"
                )
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context).hasSingleBean(PoiPipelineService.class);
                    assertThat(context).hasSingleBean(PoiEventListener.class);
                    assertThat(context).hasSingleBean(TranslationCacheService.class);
                    assertThat(context).hasSingleBean(AudioStorageService.class);
                    assertThat(context).hasSingleBean(PoiAudioEventPublisher.class);
                    assertThat(context).hasSingleBean(TranslationGlossary.class);
                    assertThat(context.getBean("translationProvider")).isInstanceOf(SeedTranslationProvider.class);
                    assertThat(context.getBean(TranslationProvider.class)).isInstanceOf(SeedTranslationProvider.class);
                    assertThat(context).doesNotHaveBean(MyMemoryTranslationProvider.class);
                });
    }
}
