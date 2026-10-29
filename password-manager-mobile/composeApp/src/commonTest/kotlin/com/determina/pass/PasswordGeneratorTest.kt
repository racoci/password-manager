package com.determina.pass

import com.determina.pass.domain.PasswordGenerator
import com.determina.pass.domain.SecurityLevel
import com.determina.pass.domain.ServiceRecord
import com.determina.pass.domain.YamlParser
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals

class PasswordGeneratorTest {

    private val generator = PasswordGenerator()
    private val yamlParser = YamlParser()

    @Test
    fun testDeterministicLengthsAndLevels() {
        val site = "github.com"
        val user = "user@test.com"
        val globalMaster = "supersecretglobal"
        val serviceMaster = "servicespecific"
        val created = "2026-08-24"

        // Low level -> 12 chars
        val lowPass = generator.generate(site, user, globalMaster, serviceMaster, created, SecurityLevel.Low)
        assertEquals(12, lowPass.length)

        // Medium level -> 16 chars
        val mediumPass = generator.generate(site, user, globalMaster, serviceMaster, created, SecurityLevel.Medium)
        assertEquals(16, mediumPass.length)
        assertNotEquals(lowPass, mediumPass)

        // High level -> 24 chars
        val highPass = generator.generate(site, user, globalMaster, serviceMaster, created, SecurityLevel.High)
        assertEquals(24, highPass.length)

        // Ultra level -> 32 chars
        val ultraPass = generator.generate(site, user, globalMaster, serviceMaster, created, SecurityLevel.Ultra)
        assertEquals(32, ultraPass.length)
        assertNotEquals(mediumPass, ultraPass)
    }

    @Test
    fun testSymmetricalYamlImportExport() {
        val records = listOf(
            ServiceRecord("1", "gitlab.com", "dev@gitlab.com", "2026-01-01", SecurityLevel.High),
            ServiceRecord("2", "aws.amazon.com", "admin@aws.com", "2026-05-15", SecurityLevel.Ultra)
        )

        val yaml = yamlParser.exportToYaml(records)
        val parsed = yamlParser.parseFromYaml(yaml)

        assertEquals(2, parsed.size)
        assertEquals("gitlab.com", parsed[0].site)
        assertEquals("dev@gitlab.com", parsed[0].user)
        assertEquals(SecurityLevel.High, parsed[0].level)

        assertEquals("aws.amazon.com", parsed[1].site)
        assertEquals("admin@aws.com", parsed[1].user)
        assertEquals(SecurityLevel.Ultra, parsed[1].level)
    }
}
