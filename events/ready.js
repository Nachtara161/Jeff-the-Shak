module.exports = {
  name: 'clientReady',
  once: true, // wird nur einmal ausgeführt, direkt beim Start
  execute(client) {
    console.log(`✅ Eingeloggt als ${client.user.tag}`);
  },
};
