$(document).ready(function(){
  // Функция загрузки файла с прогресс-баром
  window.uploadFile = function(formData) {
    var progressBar = $('#upload-progress .progress-bar');
    $('#upload-progress').show();
    $.ajax({
      xhr: function() {
        var xhr = new window.XMLHttpRequest();
        xhr.upload.addEventListener("progress", function(evt) {
          if (evt.lengthComputable) {
            var percentComplete = evt.loaded / evt.total * 100;
            progressBar.css('width', percentComplete + '%');
          }
        }, false);
        return xhr;
      },
      url: '/upload_file',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      success: function(data){
        $('#upload-progress').fadeOut(500, function(){ progressBar.css('width','0%'); });
        if(data.success){
          var ext = data.filename.split('.').pop().toLowerCase();
          var fileUrl = "/workspace/" + window.currentProject + "/" + data.filename;
          var tag = "";
          if(["mp3", "wav", "ogg"].indexOf(ext) >= 0){
            // Встраиваем аудио
            tag = "<br><div class='custom-audio' contenteditable='false'><button class='play-btn'>►</button> <span>" + data.filename + "</span></div><br>";
          } else if(["jpg", "jpeg", "png", "gif"].indexOf(ext) >= 0){
            // Встраиваем изображение
            tag = "<br><img src='" + fileUrl + "' style='max-width:100%; display:block; margin:10px auto;' class='resizable draggable'><br>";
          } else if(["mp4", "webm", "avi", "mov"].indexOf(ext) >= 0){
            // Встраиваем видео
            tag = "<br><video controls style='max-width:100%; display:block; margin:10px auto;'>" +
                  "<source src='" + fileUrl + "' type='video/" + ext + "'>" +
                  "Ваш браузер не поддерживает видео тег." +
                  "</video><br>";
          } else {
            tag = "<br><a href='" + fileUrl + "' target='_blank'>" + data.filename + "</a><br>";
          }
          $('#editor').append(tag);
        } else { 
          alert(data.error);
        }
      }
    });
  };
  
  // Обработчик кнопки загрузки файла
  $('#upload-btn').click(function(){
    // Ограничение на выбор файлов: изображения, видео и аудио
    $('#upload-file').attr('accept', 'image/*,video/*,audio/*');  // Ограничение на фото, видео, аудио
    $('#upload-file').click();
  });
  
  $('#upload-file').change(function(){
    if(!window.currentProject){
      alert("Выберите проект");
      return;
    }
    var file = this.files[0];
    
    // Проверяем, что выбранный файл — это изображение, видео или аудио
    var allowedExtensions = ["mp3", "wav", "ogg", "jpg", "jpeg", "png", "gif", "mp4", "webm", "avi", "mov"];
    var ext = file.name.split('.').pop().toLowerCase();
    if (allowedExtensions.indexOf(ext) === -1) {
      alert("Неверный формат файла. Пожалуйста, загрузите файл типа аудио, видео или изображения.");
      return;
    }
    
    var formData = new FormData();
    formData.append('project_name', window.currentProject);
    formData.append('file', file);
    uploadFile(formData);
  });
  
  // Аудиозапись через MediaRecorder
  var mediaRecorder = null;
  var audioChunks = [];
  $('#record-btn').click(function(){
    if(mediaRecorder === null){
      navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function(stream) {
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = function(e){ audioChunks.push(e.data); };
        mediaRecorder.onstop = function(){
          var audioBlob = new Blob(audioChunks, { type: 'audio/ogg; codecs=opus' });
          var fd = new FormData();
          fd.append('project_name', window.currentProject);
          fd.append('file', audioBlob, 'recording.ogg');
          uploadFile(fd);
          stream.getTracks().forEach(track => track.stop());
          mediaRecorder = null;
          $('#record-btn').text("Начать запись аудио");
        };
        mediaRecorder.start();
        $('#record-btn').text("Остановить запись аудио");
      })
      .catch(function(err){
        console.error("Ошибка доступа к микрофону: ", err);
        alert("Нет доступа к микрофону");
      });
    } else {
      mediaRecorder.stop();
    }
  });
  
  // Кастомный аудиоплеер – play/pause
  $(document).on('click', '.custom-audio .play-btn', function(){
    var $btn = $(this);
    var parentDiv = $btn.parent();
    var fileName = parentDiv.find("span").text();
    var fileUrl = "/workspace/" + window.currentProject + "/" + fileName;
    if(!$btn.data('audio')){
      var audio = new Audio(fileUrl);
      audio.onplay = function(){ $btn.text("■"); };
      audio.onpause = function(){ $btn.text("►"); };
      $btn.data('audio', audio);
      audio.play();
    } else {
      var audio = $btn.data('audio');
      if(audio.paused){
        audio.play();
      } else {
        audio.pause();
      }
    }
  });
});
