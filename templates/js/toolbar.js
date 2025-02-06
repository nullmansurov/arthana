$(document).ready(function(){
  // Заполняем выпадающий список размером от 8 до 150
  var $fontSizeSelect = $('#font-size');
  for (var i = 8; i <= 150; i++) {
    $fontSizeSelect.append($('<option>', {
      value: i,
      text: i
    }));
  }

  // Форматирование текста (жирный, курсив, подчёркивание)
  $('.format-btn').click(function(){
    var command = $(this).data('command');
    document.execCommand(command, false, null);
  });

  // Изменение шрифта
  $('#font-family').change(function(){
    var font = $(this).val();
    document.execCommand("fontName", false, font);
  });

  // Изменение размера шрифта через выпадающий список
  $('#font-size').change(function(){
    var size = $(this).val();
    var sel = window.getSelection();

    if (sel.rangeCount) {
      var range = sel.getRangeAt(0);

      // Создаем span с заданным размером шрифта
      var span = document.createElement('span');
      span.style.fontSize = size + 'px';

      // Если выделение содержит несколько элементов, surroundContents может выбросить исключение.
      // Поэтому оборачиваем выделенный контент через document.execCommand с созданием временной обёртки,
      // а затем заменяем её на нужный span.
      try {
        range.surroundContents(span);
      } catch (e) {
        // Альтернативное решение: создаем HTML-строку и вставляем через execCommand
        var selectedText = sel.toString();
        if (selectedText) {
          var html = "<span style='font-size:" + size + "px;'>" + selectedText + "</span>";
          document.execCommand("insertHTML", false, html);
        }
      }

      // Восстанавливаем выделение, если необходимо
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });

  // Изменение цвета шрифта
  $('#font-color').change(function(){
    var color = $(this).val();
    document.execCommand("foreColor", false, color);
  });

  // Вставка ссылки
  $('#link-btn').click(function(){
    var url = prompt("Введите URL ссылки:");
    if(url){
      document.execCommand("createLink", false, url);
    }
  });

  // Добавление цитаты
  $('#quote-btn').click(function(){
    document.execCommand("formatBlock", false, "blockquote");
  });

  // Нажимной текст (вставка span с иконкой копирования)
  $('#clickable-text-btn').click(function(){
    var sel = window.getSelection();
    var selectedText = sel.toString();
    if(selectedText){
      var range = sel.getRangeAt(0);
      var container = range.commonAncestorContainer;
      if(container.nodeType === 3) container = container.parentNode;
      if($(container).hasClass('clickable-text')){
        $(container).replaceWith($(container).text());
      } else {
        var html = "<span class='clickable-text'>" + selectedText + "<span class='copy-icon' contenteditable='false'>📋</span></span>";
        document.execCommand("insertHTML", false, html);
      }
    }
  });

  // Обработчик клика по иконке копирования
  $(document).on('click', '.clickable-text .copy-icon', function(e){
    e.stopPropagation();
    var $span = $(this).closest('.clickable-text');
    var text = $span.text().replace('📋','').trim();
    navigator.clipboard.writeText(text).then(function(){
      alert("Текст скопирован: " + text);
    });
  });
});
