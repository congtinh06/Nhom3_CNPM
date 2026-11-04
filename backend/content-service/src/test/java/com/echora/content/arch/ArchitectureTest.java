package com.echora.content.arch;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.methods;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;
import static com.tngtech.archunit.library.freeze.FreezingArchRule.freeze;

@AnalyzeClasses(packages = "com.echora.content", importOptions = ImportOption.DoNotIncludeTests.class)
public class ArchitectureTest {

    @ArchTest
    static final ArchRule controllers_should_not_depend_on_repositories_or_entities =
            freeze(noClasses()
                    .that().resideInAPackage("..controller..")
                    .should().dependOnClassesThat().resideInAnyPackage("..repository..", "..entity..")
                    .as("Controllers must not depend directly on repositories or entities"));

    @ArchTest
    static final ArchRule controllers_should_not_return_entities =
            freeze(methods()
                    .that().areDeclaredInClassesThat().resideInAPackage("..controller..")
                    .and().arePublic()
                    .should().notHaveRawReturnType(resideInAPackage("..entity.."))
                    .as("Public controller methods must not return entity classes directly"));

    @ArchTest
    static final ArchRule controllers_should_not_be_transactional =
            freeze(classes()
                    .that().resideInAPackage("..controller..")
                    .should().notBeAnnotatedWith("org.springframework.transaction.annotation.Transactional")
                    .as("Controllers must not be annotated with @Transactional"));

    @ArchTest
    static final ArchRule controller_methods_should_not_be_transactional =
            freeze(methods()
                    .that().areDeclaredInClassesThat().resideInAPackage("..controller..")
                    .should().notBeAnnotatedWith("org.springframework.transaction.annotation.Transactional")
                    .as("Controller methods must not be annotated with @Transactional"));

    @ArchTest
    static final ArchRule repositories_should_only_be_accessed_by_services =
            freeze(classes()
                    .that().resideInAPackage("..repository..")
                    .should().onlyHaveDependentClassesThat().resideInAnyPackage("..service..", "..repository..")
                    .as("Repositories must only be accessed by service or repository classes"));

    @ArchTest
    static final ArchRule no_cyclic_package_dependencies =
            freeze(slices().matching("com.echora.content.(**)")
                    .should().beFreeOfCycles()
                    .as("Packages must be free of cyclic dependencies"));
}
