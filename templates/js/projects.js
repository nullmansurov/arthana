$(document).ready(function(){
  // Глобальные переменные
  window.currentProject = null;
  
function openProject(project) {
  window.currentProject = project;
  $.get('/load_project', { project_name: project }, function(data){
    if (data.success) {
      $('#editor').html(data.content);
      // Анимация изменения заголовка
      $('#main-header').fadeOut(200, function() {
        $(this).text(project).fadeIn(200);
      });
      // Изменение title страницы
      document.title = project + " | Артахана мастерская";
      // Остальной код
      $('.project-item').removeClass('selected');
      $('.project-item[data-project="' + project + '"]').addClass('selected');
    } else {
      $('#editor').html('');
      // Возвращаем исходные значения при ошибке
      $('#main-header').text("Артхана мастерская - Библиотека");
      document.title = "Артахана мастерская - Проекты";
      alert(data.error);
    }
  });
}

  // Автосохранение
  setInterval(function(){
    if (window.currentProject) {
      var content = $('#editor').html();
      $.post('/save_project', { project_name: window.currentProject, content: content });
    }
  }, 30000);

  // Поиск проектов
  $('#search-projects').on('input', function(){
    var query = $(this).val().toLowerCase();
    $('.project-item').each(function(){
      var projName = $(this).data('project').toLowerCase();
      $(this).toggle(projName.indexOf(query) !== -1);
    });
  });

  // Обработчики кликов для элементов списка проектов
  $('.project-item').each(function(){
    var $item = $(this);
    var project = $item.data('project');
    $item.on('click', function(){
      openProject(project);
    });
    $item.on('contextmenu', function(e){
      e.preventDefault();
      showContextMenu(project, e.pageX, e.pageY);
    });
  });

  // Функция показа контекстного меню для проектов
  function showContextMenu(project, x, y) {
    var isFav = $('.project-item[data-project="' + project + '"]').data('fav') === '★';
    $('#ctx-fav').text(isFav ? 'Убрать из избранного' : 'Добавить в избранное');
    $('#context-menu').data('project', project)
      .css({ top: y, left: x })
      .fadeIn(200);
  }

  $(document).on('click', function(e){
    if (!$(e.target).closest('#context-menu').length) {
      $('#context-menu').fadeOut(200);
    }
  });

  // Действия контекстного меню для проектов
  $('#ctx-open').click(function(){
    var project = $('#context-menu').data('project');
    openProject(project);
    $('#context-menu').fadeOut(200);
  });
  
$('#ctx-rename').click(function() {
    var project = $('#context-menu').data('project');
    var rawNewName = prompt("Введите новое название проекта", project);
    
    if (rawNewName) {
        var newName = rawNewName.trim();
        
        if (newName && newName !== project) {
            $.ajax({
                url: '/rename_project',
                method: 'POST',
                contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
                data: {
                    old_name: project,
                    new_name: newName
                },
                success: function(data) {
                    if (data.success) {
                        // Обновление интерфейса
                        $('[data-project="' + project + '"]').text(newName);
                        $('#context-menu').data('project', newName);
                        showNotification('Проект успешно переименован', 'success');
                    } else {
                        showNotification('Ошибка: ' + data.error, 'error');
                    }
                },
                error: function(xhr) {
                    showNotification('Ошибка соединения: ' + xhr.statusText, 'error');
                },
                complete: function() {
                    $('#context-menu').fadeOut(200);
                }
            });
        }
    } else {
        $('#context-menu').fadeOut(200);
    }
});

  $('#ctx-delete').click(function(){
    var project = $('#context-menu').data('project');
    if (confirm("Вы действительно хотите удалить проект \"" + project + "\"?")) {
      $.post('/delete_project', { project_name: project }, function(data){
        if (data.success) { 
          location.reload(); 
        } else { 
          alert(data.error); 
        }
      });
    }
  });

  $('#ctx-fav').click(function(){
  var project = $('#context-menu').data('project');
  var isFav = $('.project-item[data-project="' + project + '"]').data('fav') === '★';
  var action = isFav ? 'remove' : 'add';
  
  $.post('/favorite_project', { project_name: project, action: action }, function(data){
    if (data.success) { 
      var $item = $('.project-item[data-project="' + project + '"]');
      if (action === 'add') {
        // Добавляем звезду и перемещаем вверх
        $item.data('fav', '★')
             .find('.proj-name').html('★ ' + project);
        $('#projects-container').prepend($item.detach());
      } else {
        // Убираем звезду и перемещаем вниз
        $item.data('fav', '')
             .find('.proj-name').text(project);
        $('#projects-container').append($item.detach());
      }
    }
  });
});

  // Создание нового проекта
  $('#new-project').click(function(){
    var name = prompt("Введите название нового проекта");
    if (name) {
      $.post('/create_project', { project_name: name }, function(data){
        if (data.success) { location.reload(); } else { alert(data.error); }
      });
    }
  });

  // Сохранение проекта
  $('#save').click(function(){
    if (!window.currentProject) {
      alert("Выберите проект");
      return;
    }
    var content = $('#editor').html();
    $.post('/save_project', { project_name: window.currentProject, content: content }, function(data){
      if (data.success) { alert("Сохранено"); } else { alert(data.error); }
    });
  });
});