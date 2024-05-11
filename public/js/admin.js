"use strict";

$(function() {

  let need_loading = {
    categories: true,
    page_translations: true,
  }

  function resource_loaded(key) {
    delete need_loading[key];
    if (Object.keys(need_loading).length == 0) {
      Admin.render_page()
    }
  }
  
  $.ajax({
    url: "/api/categories",
    success: function(data, status) {
      Admin.categories = data;
      resource_loaded("categories");
    }
  })

  $.ajax({
    url: `/api/translations/${page_info.lang}/admin/`,
    success: function(data, status) {
      Admin.translations.page = data;
      resource_loaded("page_translations")
    }
  })

});

class Admin {
  static categories
  static translations = {}

  static render_page() {
    let pt = this.translations.page;

    let main_element = $(".main-container");

    let categories_content = $("<div></div>")

    let categories_element = Render.foldingSection(pt.categories, categories_content);
    main_element.append(categories_element);

    let new_category_button = $(`<div class="dummy-category category" style="background-color: var(--highlight-color)">${pt.new_category}</div>`)
    categories_content.append(new_category_button)

  }
}