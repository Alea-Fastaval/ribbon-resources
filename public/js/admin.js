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
  }

  function resource_loaded(key) {
    delete need_loading[key];
    if (Object.keys(need_loading).length == 0) {
      Admin.render_page()
    }
  }

  function load_error(key) {
    let message
    if (Admin.translations.page != undefined && Admin.translations.page.resource_load_failed != undefined) {
      message = Admin.translations.page.resource_load_failed.replace("{}", key);
    } else {
      message = "Could not load resource: " + key;
    }
    alert(message);
  }

  for (const key in need_loading) {
    let object = need_loading[key].object;
    let field = need_loading[key].field;

    $.ajax({
      url: need_loading[key].url,
      success: function(data, status) {
        if (data.status == "error") {
          load_error(key);
          return;
        }

        let data_field = need_loading[key].data_field
        if (data_field === undefined) {
          object[field] = data;
        } else {
          object[field] = data[data_field];
        }
        
        resource_loaded(key);
      },
      error: function() {
        load_error(key);
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

    // Ribbon name for each language
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

    let new_glyph_button = $(`<div class="button action-button">${pt.new_glyph}</div>`);
    Admin.glyph_content.append(new_glyph_button);

    let glyph_dialog_content = $(`<div></div>`);
    glyph_dialog_content.append(`<label for="glyph-file">${pt.select_glyph}:</label>`);

    let glyph_file_input = $(`<input id="glyph-file" name="glyph_file" type="file" accept=".svg"/>`);
    glyph_dialog_content.append(glyph_file_input);

    let glyph_preprocess_section = $(`<div id="glyph-preprocess-section"></div>`);
    glyph_dialog_content.append(glyph_preprocess_section);

    // Process SVG file
    glyph_file_input.on('change', () => {
      glyph_preprocess_section.html('')
      glyph_file_input.prop('files')[0].text().then((glyph_file_content) => {
        Admin.processSVG(glyph_file_content, glyph_preprocess_section);
      }, () => {
        alert(pt.read_glyph_error + "/n" + glyph_file_input.prop('files')[0].name);
      })
    });

    // Submit glyph
    function submit_new_glyph(content) {
      let selection_rows = content.find(".glyph-element-selection-row");
      selection_rows.trigger("moseleave");

      // Update style in DOM
      let wrapper = content.find(".image-wrapper")
      let style = wrapper.find("svg style")
      let rules = style[0].sheet.cssRules
      
      let styletext = "";
      for (let i = 0; i < rules.length; i++) {
        styletext += rules[i].cssText
      }
      style.text(styletext);

      let svg = wrapper.html()
      let glyph_file_input = content.find('input[type=file]')
      let name = glyph_file_input.prop('files')[0].name

      // Upload glyph
      $.ajax({
        url: '/api/glyphs',
        method: 'POST',
        data: {
          name,
          svg
        },
        success: function(data, status) {
          if (data.status == "error") {
            alert(Admin.translations.page.glyph_upload_error)
            return;
          }
          Admin.load_glyphs();
        }
      })   
    }

    let glyph_dialog = Render.dialog(pt.new_glyph, glyph_dialog_content, submit_new_glyph);
    main_element.append(glyph_dialog);

    new_glyph_button.on('click', () => {
      glyph_dialog.open();
    })

    let glyph_display = $('<div class="glyph-display"></div>');
    Admin.glyph_content.append(glyph_display);

    Admin.load_glyphs();
  }

  static add_category(data) {
    let new_category = Render.category(data);
    Admin.categories_content.append(new_category);
  }

  static load_glyphs() {
    function render_glyphs() {
      let glyph_display = Admin.glyph_content.find(".glyph-display");
      glyph_display.html("")

      for (const glyph_id of Object.keys(Admin.glyph_list)) {
        glyph_display.append(`<div class="image-wrapper"><img src="/api/glyphs/${glyph_id}"/></div>`);
      }
    }

    $.ajax({
      url: "api/glyphs",
      success: function(data, status) {
        Admin.glyph_list = data
        render_glyphs()
      }
    })
  }

  static processSVG(glyph_content, element) {
    element.html('');

    let preview = $(`<div class="image-wrapper"></div>`);
    element.append(preview);

    preview.append(glyph_content);

    let selections = []
    let rule_types = [
      "fill",
      "stroke",
    ]

    let rules = preview.find("svg style")[0].sheet.rules;
    for (let i = 0; i < rules.length; i++) {
      for (const type of rule_types) {
        if (rules[i].style[type] != "" && rules[i].style[type] != "none") {
          rules[i].style[type] = "var(--glyph-foreground-color)"

          selections.push({
            index: i,
            type,
            name: rules[i].selectorText + " " + type,
          }) 
        }
      }
    }

    let pt = Admin.translations.page
    if (selections.length == 0) {
      alert(pt.glyph_elements_error);
    }

    let selections_table = $('<table class="glyph-element-selection"></table>');
    element.append(selections_table)

    selections_table.append(`<tr><th>${pt.element}</th><th>${pt.foreground}</th><th>${pt.background}</th></tr>`);
    for (const select of selections) {
      let selection_row = $(`<tr class="glyph-element-selection-row" data-rule-index="${select.index}" data-rule-type="${select.type}">
        <td>${select.name}</td>
      </tr>`)

      let select_foreground = $(`<input type="radio" name="selector-${select.index}-${select.type}-color" value="foreground" checked>`);
      let select_cell_f = $('<td></td>');
      select_cell_f.append(select_foreground)
      selection_row.append(select_cell_f)

      let select_background = $(`<input type="radio" name="selector-${select.index}-${select.type}-color" value="background">`);
      let select_cell_b = $('<td></td>');
      select_cell_b.append(select_background)
      selection_row.append(select_cell_b)

      selections_table.append(selection_row)

      selection_row.on('mouseenter', () => {
        rules[select.index].style[select.type] = "var(--glyph-highlight-color)";
        selection_row.css('background-color', "var(--highlight-color)");
      })

      selection_row.on('mouseleave', () => {
        let selection = selection_row.find('input:checked').val()
        rules[select.index].style[select.type] = `var(--glyph-${selection}-color)`;
        selection_row.css('background-color', "");
      })

      function update_color_select(evt) {
        let input = $(evt.target);
        if (!input.prop('checked')) return;

        let selection = input.val()
        rules[select.index].style[select.type] = `var(--glyph-${selection}-color)`;
      }

      select_background.on('change', update_color_select)
      select_foreground.on('change', update_color_select)
    }
  }
}