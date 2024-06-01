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
    category_translations: {
      url: `/api/translations/${page_info.lang}/categories*`,
      object: Admin.translations,
      field: "categories",
      data_field: "categories",
    },
    languages: {
      url: "api/translations/languages",
      object: Admin.translations,
      field: "languages"
    },
    glyphs: {
      url: "api/glyphs",
      object: Admin,
      field: "glyph_list",
    },
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
        let data_field = need_loading[key].data_field
        if (data_field === undefined) {
          object[field] = data;
        } else {
          object[field] = data[data_field];
        }
        
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

    let main_element = $(".main-content");

    //-------------------------------------------
    // Categories Section
    //-------------------------------------------
    Admin.categories_content = $("<div></div>")
    let categories_element = Render.foldingSection(pt.categories, Admin.categories_content, 'closed');
    main_element.append(categories_element);

    //-------------------------------------------
    // New Category
    //-------------------------------------------
    let new_category_button = $(`<div class="dummy-category category button">${pt.new_category}</div>`)
    Admin.categories_content.append(new_category_button)

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

      text_input.on('change', () => {
        picker.css('color', text_input.val());
        let colorstring = getComputedStyle(picker[0]).color;
        let match = colorstring.match(/rgb\((\d+), (\d+), (\d+)\)/);
        let number = (parseInt(match[1]) * 256 + parseInt(match[2])) * 256 + parseInt(match[3]);
        colorstring = "#" + number.toString(16).padStart(6, "0");
        picker.val(colorstring);
      })
    }

    color_input('background', field_list);
    color_input('stripes', field_list);
    color_input('glyph', field_list);
    color_input('wing1', field_list);
    color_input('wing2', field_list);

    function submit_new_category(content) {
      let data = {};
      
      let inputs = content.find('input');
      inputs.each((i, input)=> {
        data[$(input).attr('name')] = $(input).val()
      });

      let name = data["name_"+page_info.lang];

      $.ajax({
        url: '/api/categories',
        method: 'POST',
        data,
        success: function(data, status) {
          data.name = name;
          Admin.add_category(data);
        }
      })   
    }

    let category_dialog = Render.dialog(pt.new_category, category_dialog_content, submit_new_category);
    main_element.append(category_dialog);

    new_category_button.on('click', () => {
      category_dialog.open();
    })

    //-------------------------------------------
    // Render Categories
    //-------------------------------------------
    for (let category of Admin.categories) {
      category.name = Admin.translations.categories[category.ID]
      Admin.add_category(category);
    }

    //-------------------------------------------
    // Glyph Section
    //-------------------------------------------
    Admin.glyph_content  = $("<div></div>");
    let glyph_element = Render.foldingSection(pt.glyphs, Admin.glyph_content, 'closed');
    main_element.append(glyph_element);

    let new_glyph_button = $(`<div class="dummy-category button">${pt.new_glyph}</div>`)
    Admin.glyph_content.append(new_glyph_button)


    let glyph_display = $('<div class="glyph-display"></div>');
    Admin.glyph_content.append(glyph_display);

    for (const glyph_file of Admin.glyph_list) {
      glyph_display.append(`<div class="image-wrapper"><img src="/public/glyphs/${glyph_file}"/></div>`);
    }

  }

  static add_category(data) {
    let new_category = Render.category(data);
    Admin.categories_content.append(new_category);
  }
}