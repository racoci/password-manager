package com.determina.pass.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.determina.pass.domain.PasswordGenerator
import com.determina.pass.domain.SecurityLevel
import com.determina.pass.domain.ServiceRecord

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun App() {
    var site by remember { mutableStateOf("") }
    var user by remember { mutableStateOf("") }
    var globalMaster by remember { mutableStateOf("") }
    var serviceMaster by remember { mutableStateOf("") }
    var created by remember { mutableStateOf("2026-10-29") }
    var level by remember { mutableStateOf(SecurityLevel.Low) }

    var showGlobalMaster by remember { mutableStateOf(false) }
    var showServiceMaster by remember { mutableStateOf(false) }
    var isCopied by remember { mutableStateOf(false) }
    var searchQuery by remember { mutableStateOf("") }

    val records = remember { mutableStateListOf<ServiceRecord>() }
    val generator = remember { PasswordGenerator() }
    val clipboardManager = LocalClipboardManager.current

    // Real-time calculation of password
    val generatedPassword = remember(site, user, globalMaster, serviceMaster, created, level) {
        if (site.isNotBlank() && user.isNotBlank() && globalMaster.isNotBlank() && serviceMaster.isNotBlank()) {
            generator.generate(site, user, globalMaster, serviceMaster, created, level)
        } else {
            ""
        }
    }

    val filteredRecords = remember(records, searchQuery) {
        if (searchQuery.isBlank()) records else records.filter {
            it.site.contains(searchQuery, ignoreCase = true) || it.user.contains(searchQuery, ignoreCase = true)
        }
    }

    MaterialTheme(
        colorScheme = darkColorScheme(
            background = Color(0xFF0F111A),
            surface = Color(0xFF1A1D29),
            primary = Color(0xFF818CF8),
            onPrimary = Color.White
        )
    ) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header
                item {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "🔐 DeterminaPass",
                            fontSize = 28.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Gerador determinístico móvel. Suas senhas nunca são salvas em bancos de dados!",
                            fontSize = 13.sp,
                            color = Color(0xFF94A3B8),
                            lineHeight = 18.sp
                        )
                    }
                }

                // Inputs Card
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Text(
                                text = "⚙️ Parâmetros do Serviço",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )

                            OutlinedTextField(
                                value = site,
                                onValueChange = { site = it },
                                label = { Text("Site / Serviço") },
                                placeholder = { Text("ex: github.com") },
                                modifier = Modifier.fillMaxWidth()
                            )

                            OutlinedTextField(
                                value = user,
                                onValueChange = { user = it },
                                label = { Text("Usuário / Email") },
                                placeholder = { Text("ex: user@domain.com") },
                                modifier = Modifier.fillMaxWidth()
                            )

                            OutlinedTextField(
                                value = globalMaster,
                                onValueChange = { globalMaster = it },
                                label = { Text("1. Senha Mnemônica Global") },
                                visualTransformation = if (showGlobalMaster) VisualTransformation.None else PasswordVisualTransformation(),
                                trailingIcon = {
                                    TextButton(onClick = { showGlobalMaster = !showGlobalMaster }) {
                                        Text(if (showGlobalMaster) "👁️" else "🙈")
                                    }
                                },
                                modifier = Modifier.fillMaxWidth()
                            )

                            OutlinedTextField(
                                value = serviceMaster,
                                onValueChange = { serviceMaster = it },
                                label = { Text("2. Senha Mnemônica do Serviço") },
                                visualTransformation = if (showServiceMaster) VisualTransformation.None else PasswordVisualTransformation(),
                                trailingIcon = {
                                    TextButton(onClick = { showServiceMaster = !showServiceMaster }) {
                                        Text(if (showServiceMaster) "👁️" else "🙈")
                                    }
                                },
                                modifier = Modifier.fillMaxWidth()
                            )

                            // Security Level selector
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Nível de Segurança:", fontSize = 14.sp)
                                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    SecurityLevel.entries.forEach { lvl ->
                                        FilterChip(
                                            selected = level == lvl,
                                            onClick = { level = lvl },
                                            label = { Text(lvl.name) }
                                        )
                                    }
                                }
                            }

                            Button(
                                onClick = {
                                    if (site.isNotBlank() && user.isNotBlank()) {
                                        records.removeAll { it.site == site && it.user == user }
                                        records.add(
                                            ServiceRecord(
                                                id = site + "_" + user,
                                                site = site,
                                                user = user,
                                                updated = created,
                                                level = level
                                            )
                                        )
                                    }
                                },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("⭐ Salvar nos Favoritos")
                            }
                        }
                    }
                }

                // Password Display Card
                if (generatedPassword.isNotEmpty()) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B4B)),
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "Senha Determinística Gerada (${level.length} caracteres):",
                                    fontSize = 12.sp,
                                    color = Color(0xFF818CF8)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = generatedPassword,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace,
                                    color = Color.White
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                Button(
                                    onClick = {
                                        clipboardManager.setText(AnnotatedString(generatedPassword))
                                        isCopied = true
                                    },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (isCopied) Color(0xFF059669) else Color(0xFF4F46E5)
                                    )
                                ) {
                                    Text(if (isCopied) "✅ Copiado!" else "📋 Copiar Senha")
                                }
                            }
                        }
                    }
                }

                // Services List Header
                item {
                    Text(
                        text = "📁 Meus Serviços Salvos (${filteredRecords.size})",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }

                items(filteredRecords) { rec ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                site = rec.site
                                user = rec.user
                                created = rec.updated
                                level = rec.level
                            },
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF11131E)),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(text = rec.site, fontWeight = FontWeight.Bold, color = Color.White)
                                Text(text = rec.user, fontSize = 12.sp, color = Color(0xFF94A3B8))
                            }
                            IconButton(onClick = { records.remove(rec) }) {
                                Text("❌", fontSize = 14.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
