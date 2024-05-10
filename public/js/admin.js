"use strict";

$(function() {
  let categories
  
  $.ajax({
    url: "/api/categories",
    succes: function(data, status) {
      categories = JSON.parse(data);
    }
  })

  let content = $(".main-container");
  content.append(Render.foldingSection("Kategorier"));
});