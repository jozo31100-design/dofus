const app = document.getElementById('app');
app.textContent = 'Terres de Gaule — chargement… (' + (window.tdg ? 'pont Electron OK' : 'pas de pont') + ')';
