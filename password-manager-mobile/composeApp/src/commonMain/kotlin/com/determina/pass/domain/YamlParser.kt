package com.determina.pass.domain

class YamlParser {

    fun exportToYaml(records: List<ServiceRecord>): String {
        val sb = StringBuilder()
        sb.append("services:\n")
        for (rec in records) {
            sb.append("  - site: \"${rec.site}\"\n")
            sb.append("    user: \"${rec.user}\"\n")
            sb.append("    updated: \"${rec.updated}\"\n")
            sb.append("    security_level: ${rec.level.value}\n")
        }
        return sb.toString()
    }

    fun parseFromYaml(yamlText: String): List<ServiceRecord> {
        val lines = yamlText.lines()
        val records = mutableListOf<ServiceRecord>()
        var currentId = ""
        var currentSite = ""
        var currentUser = ""
        var currentUpdated = ""
        var currentLevel = SecurityLevel.Low

        for (line in lines) {
            val trimmed = line.trim()
            if (trimmed.startsWith("- site:")) {
                if (currentSite.isNotEmpty() && currentUser.isNotEmpty()) {
                    records.add(
                        ServiceRecord(
                            id = currentId.ifEmpty { currentSite + "_" + currentUser },
                            site = currentSite,
                            user = currentUser,
                            updated = currentUpdated,
                            level = currentLevel
                        )
                    )
                }
                currentSite = trimmed.removePrefix("- site:").replace("\"", "").trim()
                currentUser = ""
                currentUpdated = ""
                currentLevel = SecurityLevel.Low
                currentId = ""
            } else if (trimmed.startsWith("user:")) {
                currentUser = trimmed.removePrefix("user:").replace("\"", "").trim()
            } else if (trimmed.startsWith("updated:")) {
                currentUpdated = trimmed.removePrefix("updated:").replace("\"", "").trim()
            } else if (trimmed.startsWith("security_level:")) {
                val lvlVal = trimmed.removePrefix("security_level:").trim().toIntOrNull() ?: 1
                currentLevel = SecurityLevel.fromValue(lvlVal)
            }
        }

        if (currentSite.isNotEmpty() && currentUser.isNotEmpty()) {
            records.add(
                ServiceRecord(
                    id = currentId.ifEmpty { currentSite + "_" + currentUser },
                    site = currentSite,
                    user = currentUser,
                    updated = currentUpdated,
                    level = currentLevel
                )
            )
        }

        return records
    }
}
