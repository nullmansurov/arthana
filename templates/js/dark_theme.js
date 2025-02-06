// Подключаем стили для темной темы
const darkThemeStylesheet = document.createElement('link');
darkThemeStylesheet.rel = 'stylesheet';
darkThemeStylesheet.href = 'js/dark_styles.css';

// Функция для переключения темы
function toggleTheme() {
  const currentTheme = localStorage.getItem('theme');
  
  if (currentTheme === 'dark') {
    // Отключаем темную тему
    document.head.removeChild(darkThemeStylesheet);
    localStorage.setItem('theme', 'light');
    document.getElementById('toggle-theme').textContent = 'Тёмная тема';
  } else {
    // Включаем темную тему
    document.head.appendChild(darkThemeStylesheet);
    localStorage.setItem('theme', 'dark');
    document.getElementById('toggle-theme').textContent = 'Светлая тема';
  }
}

// Проверяем, какая тема была сохранена в localStorage, и применяем ее
window.onload = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.head.appendChild(darkThemeStylesheet);
    document.getElementById('toggle-theme').textContent = 'Светлая тема';
  } else {
    document.getElementById('toggle-theme').textContent = 'Тёмная тема';
  }
};

// Добавляем обработчик события для кнопки переключения темы
document.getElementById('toggle-theme').addEventListener('click', toggleTheme);
