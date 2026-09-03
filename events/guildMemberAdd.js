module.exports = {
  name: 'guildMemberAdd',
  once: false, // soll bei JEDEM neuen Mitglied ausgeführt werden
  async execute(member, client) {
    const config = client.config;

    console.log(`👋 Neues Mitglied erkannt: ${member.user.tag}`);

    // --- 1) AUTOROLLEN (eine oder mehrere) ---
    if (Array.isArray(config.autoRoleIds) && config.autoRoleIds.length > 0) {
      console.log(`   → Versuche ${config.autoRoleIds.length} Autorolle(n) zu vergeben...`);
      for (const roleId of config.autoRoleIds) {
        // Platzhalter-Einträge überspringen, falls noch nicht alle Slots befüllt sind
        if (!roleId || roleId.startsWith('HIER_')) continue;

        try {
          const role = member.guild.roles.cache.get(roleId);
          if (role) {
            await member.roles.add(role);
            console.log(`   ✅ Rolle "${role.name}" (${roleId}) erfolgreich vergeben.`);
          } else {
            console.warn(`   ⚠️ Autorolle mit ID ${roleId} nicht gefunden. Ist die ID in config.json korrekt?`);
          }
        } catch (err) {
          console.error(`   ❌ Fehler beim Vergeben der Autorolle ${roleId}:`, err.message);
        }
      }
    } else {
      console.log('   → Keine Autorollen konfiguriert.');
    }

    // --- 2) WILLKOMMENSNACHRICHT ---
    if (config.welcomeChannelId && config.welcomeChannelId !== 'HIER_KANAL_ID_EINTRAGEN') {
      try {
        const channel = member.guild.channels.cache.get(config.welcomeChannelId);
        if (!channel) {
          console.warn('⚠️ Willkommens-Kanal nicht gefunden. Ist die ID in config.json korrekt?');
          return;
        }

        // Platzhalter im Nachrichtentext ersetzen
        const text = config.welcomeMessage
          .replace('{user}', `<@${member.id}>`)
          .replace('{server}', member.guild.name)
          .replace('{membercount}', member.guild.memberCount);

        await channel.send(text);
      } catch (err) {
        console.error('Fehler beim Senden der Willkommensnachricht:', err);
      }
    }
  },
};
