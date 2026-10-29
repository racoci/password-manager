package com.determina.pass.domain

enum class SecurityLevel(val value: Int, val label: String, val length: Int) {
    Low(1, "Low - Básico", 12),
    Medium(2, "Medium - Recomendado", 16),
    High(3, "High - Sensível", 24),
    Ultra(4, "Ultra - Máxima Segurança", 32);

    companion object {
        fun fromValue(value: Int): SecurityLevel =
            entries.find { it.value == value } ?: Low
    }
}

data class ServiceRecord(
    val id: String,
    val site: String,
    val user: String,
    val updated: String,
    val level: SecurityLevel = SecurityLevel.Low
)
