"use strict";

$(function() {

  let need_loading = {
    categories: {
      url: "/api/categories",
      object: Admin,
      field: "categories"
    },
    page_translations: {
      url: `/api/translations/${page_info.lang}/admin/`,
      object: Admin.translations,
      field: "page",
    },
    general_translations: {
      url: `/api/translations/${page_info.lang}/general/`,
      object: Admin.translations,
      field: "general",
    },
    languages: {
      url: "api/translations/languages",
      object: Admin.translations,
      field: "languages"
    }
  }

  function resource_loaded(key) {
    delete need_loading[key];
    if (Object.keys(need_loading).length == 0) {
      Admin.render_page()
    }
  }

  for (const key in need_loading) {
    let object = need_loading[key].object;
    let field = need_loading[key].field;

    $.ajax({
      url: need_loading[key].url,
      success: function(data, status) {
        object[field] = data;
        resource_loaded(key);
      }
    }) 
  }
});

class Admin {
  static categories
  static translations = {}

  static render_page() {
    let pt = Admin.translations.page;
    let gt = Admin.translations.general;

    let main_element = $(".main-container");

    let categories_content = $("<div></div>")

    let categories_element = Render.foldingSection(pt.categories, categories_content);
    main_element.append(categories_element);

    let new_category_button = $(`<div class="dummy-category category button" style="background-color: var(--highlight-color)">${pt.new_category}</div>`)
    categories_content.append(new_category_button)

    let category_dialog_content = $('<div></div>');
    let field_list = $('<div class="dialog-fieldlist"></div>');
    category_dialog_content.append(field_list);

    for (const lang of Admin.translations.languages) {
      field_list.append(`<label class="dialog-field-label" for="category-name-${lang}">${pt['name_'+lang]}:</label>`);
      field_list.append(`<input class="dialog-field col2" id="category-name-${lang}" name="name_${lang}" type="text">`);
    }

    function color_input(name, element) {
      element.append(`<label class="dialog-field-label" for="category-${name}">${pt[name+'_color']}:</label>`);
      
      let text_input = $(`<input class="dialog-field col2" id="category-${name}" name="${name}_color" type="text">`);
      element.append(text_input);
      
      let picker = $(`<input class="dialog-field col3" id="category-${name}-picker" name="${name}_color_picker" type="color">`);
      element.append(picker);

      picker.on('change', () => {
        text_input.val(picker.val());
      });
    }

    color_input('background', field_list);
    color_input('foreground', field_list);

    function submit_new_category(content) {

    }

    let category_dialog = Render.dialog(pt.new_category, category_dialog_content, submit_new_category);
    main_element.append(category_dialog);

    new_category_button.on('click', () => {
      category_dialog.open();
    })
  }
}