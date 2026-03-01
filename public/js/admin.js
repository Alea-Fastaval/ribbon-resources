"use strict";

$(function() {

  let resources = {
    categories: {},
    ribbons: {},
    orders: {},
    options:{},
    translations: {
      _sub_list: true,
      page: {
        url: `/api/translations/${page_info.lang}/admin/`,
      },
      general: {
        url: `/api/translations/${page_info.lang}/general/`,
      },
      categories: {
        url: `/api/translations/${page_info.lang}/categories*`,
        data_field: "categories",
      },
      ribbons: {
        url: `/api/translations/${page_info.lang}/ribbons*`,
        data_field: "ribbons",
      },
      languages: {},
    },
  }

  Ribbon.load_resources(() => {Admin.render_page()}, resources, "/api/");
});

class Admin {
  static translations = {}

  static render_page() {
    Render.init(Ribbon.translations);

    let pt = Ribbon.translations.page;
    let gt = Ribbon.translations.general;

    let main_element = $(".main-content");
    //-------------------------------------------
    // Overview
    //-------------------------------------------
    let overview_tab = $('<div class="tab" id="overview-tab"></div>');
    main_element.append(overview_tab);

    let count_table = $(
      `<table id="stats-table"><tbody>
        <tr><td>${pt.accounts}</td><td>${Ribbon.orders.counts.users[2025]}</td></tr>
        <tr><td>${pt.orders}</td><td>${Ribbon.orders.counts.orders[2025]}</td></tr>
        <tr><td>${pt.closed}</td><td>${Ribbon.orders.counts.closed[2025]}</td></tr>
      </tbody></table>`
    );
    overview_tab.append(count_table);

    let export_text = $(`<p></p>`);
    let download_button =  $(`<div class="button dialog-button">${pt.export_download}</div>`);
    let create_button =  $(`<div class="button dialog-button">${pt.export_create}</div>`);
    let export_alert = Render.alert(pt.export_link, export_text, [download_button, create_button]);
    overview_tab.append(export_alert);
    
    download_button.on('click', () => {
      export_alert.close();
      window.open('/public/export/export.pdf','_blank');
    });

    create_button.on('click', () => {
      export_alert.close()
      $.ajax({
        url: "api/export",
        success: function(data, status) {
          if (data.status != 'success') {
            console.log('Export result', data);
            alert(pt.export_error);
            return;
          }

          window.open(data.download_file,'_blank');
        },
        timeout: 3*60*1000
      })
    });

    let export_button = $(`<button class="button export-button">${pt.export_link}</button>`);
    export_button.on('click', () => {
      $.ajax({
        url: "api/export/time",
        success: function(data, status) {
          if (data.status != 'success') {
            console.log('Export time result', data);
            export_text.html(pt.export_time_error);
            export_alert.open()
            return;
          }
          export_text.html(
            `${pt.export_text1} ${Math.floor(data.file_age_minutes)} ${pt.export_text2}`
          );
          export_alert.open();
        },
        error: function() {
          export_text.html(pt.export_time_error);
          export_alert.open()
        }
      })
    })
    overview_tab.append(export_button);

    //-------------------------------------------
    // Settings
    //-------------------------------------------
    let settings_tab = $('<div class="tab" id="settings-tab"></div>');
    main_element.append(settings_tab);

    let closed_status_label = $(`<label for="signup-closed-checkbox">${pt.closed_checkbox}</label>`)
    settings_tab.append(closed_status_label)

    let closed_status_checkbox = $(`<input type="checkbox" id="signup-closed-checkbox">`)
    closed_status_checkbox.prop('checked', Ribbon.options.show_closed_message == 'true')
    settings_tab.append(closed_status_checkbox)

    closed_status_checkbox.on("click", () => {
      let status = closed_status_checkbox.prop('checked')
      $.ajax({
        url: "api/options",
        method: "POST",
        data: {
          name: "show_closed_message",
          value: status,
        },
        success: function(data, status) {
          if (data.status != 'success') {
            console.log('Error setting option', data);
            alert(pt.general_error)
            return;
          }
        },
        error: function() {
          alert(pt.general_error)
        }
      })
    })


    //-------------------------------------------
    // Glyph Selection Dialog
    //-------------------------------------------
    let glyph_select_content = $(`<div class="glyph-selector-content"></div>`);
    Admin.glyph_select_dialog = Render.dialog(pt.select_glyph, glyph_select_content);
    Admin.glyph_select_dialog.on('cancel', () => {
      Admin.glyph_select_dialog.listeners['ok'] = [];
    });
    settings_tab.append(Admin.glyph_select_dialog);

    Admin.glyph_select_dialog.update = function() {
      glyph_select_content.html("");

      for (const glyph_id of Object.keys(Admin.glyph_list)) {
        glyph_select_content.append(`<div class="glyph-button glyph-wrapper" glyph-id="${glyph_id}"><img src="/api/glyphs/${glyph_id}"/></div>`);

        glyph_select_content.find(".glyph-button").on("click", (evt) => {
          glyph_select_content.find(".glyph-button").removeClass('selected');
          $(evt.delegateTarget).addClass('selected');
        });
      }
    }
    //-------------------------------------------
    // Categories Section
    //-------------------------------------------
    Admin.categories_content = $("<div></div>")
    let categories_element = Render.foldingSection(pt.categories, Admin.categories_content, 'closed');
    settings_tab.append(categories_element);

    //-------------------------------------------
    // New Category
    //-------------------------------------------
    let new_category_button = $(`<div class="dummy-header button">${pt.new_category}</div>`)
    Admin.categories_content.append(new_category_button)

    let category_dialog_content = Admin.new_category_dialog_content();

    let category_dialog = Render.dialog(pt.new_category, category_dialog_content);
    category_dialog.on('ok', Admin.submit_new_category);
    settings_tab.append(category_dialog);

    new_category_button.on('click', () => {
      category_dialog.open();
    })

    //-------------------------------------------
    // Render Categories
    //-------------------------------------------
    for (const cat_index in Ribbon.categories) {
      const category = Ribbon.categories[cat_index];

      category.name = Ribbon.translations.categories[category.ID]
      let category_element = Render.category(category, 'closed');
      category_element.attr('cat-id', category.ID);
      Admin.categories_content.append(category_element);  

      let ribbon_list = category_element.find(".folding-section-content");

      //-------------------------------------------
      // New Ribbon
      //-------------------------------------------
      let new_ribbon_button = $(`<div class="dummy-header button">${pt.new_ribbon}</div>`);
      ribbon_list.append(new_ribbon_button);

      new_ribbon_button.on('click', () => {
        let new_ribbon = Admin.new_ribbon_dialog(category.ID);
        new_ribbon_button.after(new_ribbon);
      })

      //-------------------------------------------
      // Render Ribbons
      //-------------------------------------------
      if (Ribbon.ribbons[category.ID]) for (const ribbon of Ribbon.ribbons[category.ID]) {
        ribbon.name = Ribbon.translations.ribbons[ribbon.ID].name;
        ribbon.desc = Ribbon.translations.ribbons[ribbon.ID].desc;
        let ribbon_element = Render.ribbon(ribbon);
        ribbon_list.append(ribbon_element);

        // Edit button
        let edit_button = $(`<button class="ribbon-edit-button">${pt.edit}</button>`);
        ribbon_element.after(edit_button);
        edit_button.on('click', () => {
          Admin.edit_ribbon(edit_button);
        })

        let retire_button
        if (!ribbon.Retired) {
          // Retire button
          retire_button = $(`<button class="ribbon-retire-button">${pt.retire}</button>`);
          edit_button.after(retire_button);
          retire_button.on('click', () => {
            Admin.retire_ribbon(ribbon_element, retire_button);
          })
        } else {
          // Retire button
          retire_button = $(`<button class="ribbon-unretire-button">${pt.unretire}</button>`);
          edit_button.after(retire_button);
          retire_button.on('click', () => {
            Admin.unretire_ribbon(ribbon_element, retire_button);
          })
        }
        
        if (!ribbon.Hidden) {
          // Delete button
          let delete_button = $(`<button class="ribbon-delete-button">${pt.hide}</button>`);
          retire_button.after(delete_button);
          delete_button.on('click', () => {
            Admin.delete_ribbon(delete_button);
          })
        } else {
          // Show button
          let show_button = $(`<button class="ribbon-show-button">${pt.show}</button>`);
          retire_button.after(show_button);
          show_button.on('click', () => {
            Admin.show_ribbon(show_button);
          })
        }

      }
    }

    //-------------------------------------------
    // Glyph Section
    //-------------------------------------------
    Admin.glyph_content  = $("<div></div>");
    let glyph_element = Render.foldingSection(pt.glyphs, Admin.glyph_content, 'closed');
    settings_tab.append(glyph_element);

    let new_glyph_button = $(`<div class="button action-button">${pt.new_glyph}</div>`);
    Admin.glyph_content.append(new_glyph_button);

    let glyph_dialog_content = Admin.new_glyph_dialog_content();
    let glyph_dialog = Render.dialog(pt.new_glyph, glyph_dialog_content);
    glyph_dialog.on('ok', Admin.submit_new_glyph)
    settings_tab.append(glyph_dialog);

    new_glyph_button.on('click', () => {
      glyph_dialog.open();
    })

    let glyph_display = $('<div class="glyph-display"></div>');
    Admin.glyph_content.append(glyph_display);

    Admin.load_glyphs();

    //-------------------------------------------
    // Navigation
    //-------------------------------------------
    let nav_section = $('nav');
    let settings_button = $(`<button class="button nav-button" tab="settings-tab">${pt.settings_button}</button>`);
    settings_button.on('click', () => {Admin.nav_click(settings_button)})
    nav_section.append(settings_button);

    let overview_button = $(`<button class="button nav-button" tab="overview-tab">${pt.overview_button}</button>`);
    overview_button.on('click', () => {Admin.nav_click(overview_button)})
    nav_section.append(overview_button);

    Admin.nav_click(settings_button)
  }

  //-------------------------------------------
  // Helper Functions
  //-------------------------------------------
  static nav_click(button) {
    $('.tab').hide();
    $('nav button').removeClass('active');
    $(`#${button.attr('tab')}`).show();
    button.addClass('active');
  }

  /**
   * Creates the content for the "New Category"-dialog
   * @returns jQuery element
   */
  static new_category_dialog_content() {
    let pt = Ribbon.translations.page;
    
    let category_dialog_content = $('<div></div>');
    let field_list = $('<div class="dialog-fieldlist"></div>');
    category_dialog_content.append(field_list);

    // Category name for each language
    for (const lang of Ribbon.translations.languages) {
      field_list.append(`<label class="dialog-field-label" for="category-name-${lang}">${pt['name_'+lang]}:</label>`);
      field_list.append(`<input class="dialog-field col2" id="category-name-${lang}" name="name_${lang}" type="text">`);
    }

    function add_color_input(element, name) {
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

    add_color_input(field_list, 'background');
    add_color_input(field_list, 'stripes');
    add_color_input(field_list, 'glyph');
    add_color_input(field_list, 'wing1');
    add_color_input(field_list, 'wing2');

    return category_dialog_content; 
  }

  /**
   * Submits a new category to the server using content of the "New Category"-dialog
   */
  static submit_new_category(content) {
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
        let new_category = Render.category(data, 'closed');
        Admin.categories_content.append(new_category);  
      }
    })   
  }

  /**
   * Creates a new element for displaying ribbon properties
   * using the data provided
   * @returns jQerry element
   */
  static new_ribbon_dialog(cat_id, info = {}) {
    let gt = Ribbon.translations.general;
    let pt = Ribbon.translations.page;

    info.id ??= 'new';
    info.name ??= [];
    info.description ??= [];
    info.glyph_id ??= 0;
    info.no_wings ??= false;

    let element = $(`<div class="ribbon-info-dialog"></div>`);
    if (info.id == 'new') element.addClass('new');
    element.attr('ribbon-id', info.id);

    let element_content = $(`<div class="ribbon-info-content"></div>`);
    element.append(element_content);

    let glyph_selector = Admin.new_glyph_selector(info.glyph_id, cat_id);
    element_content.append(glyph_selector);

    glyph_selector.on('click', () => {
      Admin.glyph_select_dialog.on('ok', (content) => {
        glyph_selector.html('');
        let glyph_id = content.find('.selected').attr('glyph-id');
        if (glyph_id) {
          let fg = glyph_selector.attr('fg');
          let bg = glyph_selector.attr('bg');
          glyph_selector.append(`<img src="/api/glyphs/${glyph_id}?fg=${fg}&bg=${bg}"/>`)
          glyph_selector.attr('glyph-id', glyph_id);
        } else {
          glyph_selector.append(`<div class="placeholder">${pt.select_glyph}</div>`)
          glyph_selector.attr('glyph-id', '');
        }

        // Remove listener
        Admin.glyph_select_dialog.listeners['ok'] = [];
      });
      Admin.glyph_select_dialog.open();
    })

    let no_wings_wrapper = $(`<div class="no-wings-wrapper col2"></div>`);
    no_wings_wrapper.append(`<label for="no-wings-${info.id}">${pt.no_wings}</label>`);
    no_wings_wrapper.append(`<input id="no-wings-${info.id}" type="checkbox" ${info.no_wings ? 'checked' : ''}>`);
    element_content.append(no_wings_wrapper);

    element_content.append(`<div class="header col2">${pt.name}</div>`);
    element_content.append(`<div class="header col3">${pt.description}</div>`);

    for (const lang of Ribbon.translations.languages) {
      element_content.append(`<div class="label col1">${pt[lang]}</div>`);
      element_content.append(`<input class="col2 name" type="text" value="${info.name[lang] ?? ""}" id="name-${info.id}-${lang}" />`);
      element_content.append(`<input class="col3 desc" type="text" value="${info.description[lang] ?? ""}" id="desc-${info.id}-${lang}" />`);
    }

    // Instead of tracking changes we just always show the buttons
    element.addClass('changed')

    let button_wrapper = $(`<div class="button-wrapper dialog-footer"></div>`);
    element.append(button_wrapper);

    // Save button
    let save_button = $(`<div class="save-button dialog-button">${gt.save}</button>`);
    button_wrapper.append(save_button);

    save_button.on('click', () => {
      Admin.submit_ribbon(element);
    });

    // Cancel button
    let cancel_button = $(`<div class="save-button dialog-button">${gt.cancel}</button>`);
    button_wrapper.append(cancel_button);

    cancel_button.on('click', () => {
      element.remove()
    });

    return element;
  }

  /**
   * Submits a new ribbon element to the server
   */
  static submit_ribbon(element) {
    let data = {};

    data.id = element.attr('ribbon-id');
    data.category = element.parents(".category").attr('cat-id');
    data.glyph = element.find(".glyph-selector").attr('glyph-id');
    data.no_wings = element.find(`#no-wings-${data.id}`).prop('checked');

    for (const lang of Ribbon.translations.languages) {
      data[`name_${lang}`] = element.find(`#name-${data.id}-${lang}`).val();
      data[`desc_${lang}`] = element.find(`#desc-${data.id}-${lang}`).val();
    }

    let name = data["name_"+page_info.lang];
    let desc = data["desc_"+page_info.lang];

    if (data.id == 'new') {
      $.ajax({
        url: '/api/ribbons',
        method: 'POST',
        data,
        success: function(data) {
          if (data.status == "error") {
            alert(Ribbon.translations.page.ribbon_submit_error)
            return;
          }
          
          // Remove edit dialog
          element.remove()

          // Add new ribbon
          data.name = name;
          data.desc = desc;
          let ribbon_element = Render.ribbon(data);
          Admin.categories_content.find(`#category-${data.Category} .folding-section-content`).append(ribbon_element);

          // Add translations
          Ribbon.translations.ribbons[data.ID] = {
            desc,
            name,
          }

          let pt = Ribbon.translations.page
          // Edit button
          let edit_button = $(`<button class="ribbon-edit-button">${pt.edit}</button>`);
          ribbon_element.after(edit_button);
          edit_button.on('click', () => {
            Admin.edit_ribbon(edit_button);
          })

          // Retire button
          let retire_button = $(`<button class="ribbon-retire-button">${pt.retire}</button>`);
          edit_button.after(retire_button);
          retire_button.on('click', () => {
            Admin.retire_ribbon(ribbon_element, retire_button);
          })

          // Delete button
          let delete_button = $(`<button class="ribbon-delete-button">${pt.hide}</button>`);
          retire_button.after(delete_button);
          delete_button.on('click', () => {
            Admin.delete_ribbon(delete_button);
          })
        },
        error: function() {
          alert(Ribbon.translations.page.ribbon_submit_error)
        }
      })
      return
    }

    $.ajax({
      url: '/api/ribbons',
      method: 'PATCH',
      data,
      success: function(data) {
        if (data.status == "error") {
          alert(Ribbon.translations.page.ribbon_submit_error)
          return;
        }
        
        // Remove edit dialog
        element.remove()

        // Update ribbon
        data.name = name;
        data.desc = desc;
        let new_ribbon = Render.ribbon(data);
        let old_ribbon = Admin.categories_content.find(`.ribbon-wrapper[ribbon-id=${data.ID}]`)
        old_ribbon.after(new_ribbon)
        old_ribbon.remove()

        // Update translations
        Ribbon.translations.ribbons[data.ID] = {
          desc,
          name,
        }
      },
      error: function() {
        alert(Ribbon.translations.page.ribbon_submit_error)
      }
    })
  }

  /**
   * Delete a ribbon element
   */
  static edit_ribbon(button) {
    let ribbon = button
    while (!ribbon.is(".ribbon-wrapper")) {
      ribbon = ribbon.prev()
    }

    let pt = Ribbon.translations.page
    let ribbon_id = ribbon.attr('ribbon-id');

    $.ajax({
      url: 'api/ribbons/'+ribbon_id,
      method: 'GET',
      success: function(data, status) {
        if (data.status == "error") {
          alert(pt.resource_load_failed.replace("{}", pt.ribbon_info))
          return;
        }

        Admin.show_edit_dialog(ribbon, data)
      },
      error: function() {
        alert(pt.resource_load_failed.replace("{}", pt.ribbon_info))
      }
    })
  }

  static show_edit_dialog(element, data) {
    let info = {}
    info.id = data.ribbon.ID
    info.glyph_id = data.ribbon.Glyph
    info.no_wings = data.ribbon.NoWings
    info.name = []
    info.description = []

    for (const lang of Ribbon.translations.languages) {
      info.name[lang] = data.text[lang].name
      info.description[lang] = data.text[lang].desc
    }

    let dialog = Admin.new_ribbon_dialog(data.ribbon.Category, info)
    element.nextUntil(".ribbon-wrapper").last().after(dialog)
  }

  /**
   * Delete a ribbon element
   */
  static delete_ribbon(button) {
    let ribbon = button
    while (!ribbon.is(".ribbon-wrapper")) {
      ribbon = ribbon.prev()
    }

    let pt = Ribbon.translations.page;
    let ribbon_id = ribbon.attr('ribbon-id');

    $.ajax({
      url: '/api/ribbons/'+ribbon_id,
      method: 'DELETE',
      success: function(data, status) {
        if (data.status == "error") {
          alert(Ribbon.translations.page.ribbon_delete_error)
          return;
        }
        
        ribbon.addClass('deleted')
        let show_button = $(`<button class="ribbon-show-button">${pt.show}</button>`);
        button.after(show_button)
        button.remove()

        show_button.on('click', () => {
          Admin.show_ribbon(show_button);
        })
        
      },
      error: function() {
        alert(Ribbon.translations.page.ribbon_delete_error)
      }
    })   
  }

  /**
   * Show ribbon element again
   */
  static show_ribbon(button) {
    let ribbon = button
    while (!ribbon.is(".ribbon-wrapper")) {
      ribbon = ribbon.prev()
    }

    let pt = Ribbon.translations.page;
    let ribbon_id = ribbon.attr('ribbon-id');

    $.ajax({
      url: '/api/ribbons/show/'+ribbon_id,
      method: 'POST',
      success: function(data, status) {
        if (data.status == "error") {
          alert(Ribbon.translations.page.ribbon_show_error)
          return;
        }
        
        ribbon.removeClass('deleted')
        let delete_button = $(`<button class="ribbon-delete-button">${pt.hide}</button>`);
        button.after(delete_button)
        button.remove()

        delete_button.on('click', () => {
          Admin.delete_ribbon(delete_button);
        })
      },
      error: function() {
        alert(Ribbon.translations.page.ribbon_show_error)
      }
    })   
  }

  /**
   * Creates a glyph selector GUI element
   * @returns jQerry element
   */
  static new_glyph_selector(glyph_id, cat_id) {
    let pt = Ribbon.translations.page;

    let fg = encodeURIComponent(Ribbon.category_by_id[cat_id].Glyph);
    let bg = encodeURIComponent(Ribbon.category_by_id[cat_id].Background);

    let element = $(`<div class="glyph-selector glyph-wrapper" fg="${fg}" bg="${bg}"></div>`);

    if (glyph_id) {
      element.append(`<img src="/api/glyphs/${glyph_id}?fg=${fg}&bg=${bg}"/>`)
      element.attr('glyph-id', glyph_id)
    } else {
      element.append(`<div class="placeholder">${pt.select_glyph}</div>`)
    }

    return element;
  }

  /**
   * Loads all glyphs from the server and updates the glyph display and glyph selction dialog
   * with the new result
   */
  static load_glyphs() {
    function update_glyphs() {
      let glyph_display = Admin.glyph_content.find(".glyph-display");
      glyph_display.html("")

      for (const glyph_id of Object.keys(Admin.glyph_list)) {
        glyph_display.append(`<div class="glyph-wrapper"><img src="/api/glyphs/${glyph_id}"/></div>`);
      }

      if (Admin.glyph_select_dialog) {
        Admin.glyph_select_dialog.update();
      }
    }

    $.ajax({
      url: "api/glyphs",
      success: function(data, status) {
        Admin.glyph_list = data
        update_glyphs()
      }
    })
  }

  /**
   * Creates the content for the glyph selection dialog
   * @returns jQerry element
   */
  static new_glyph_dialog_content() {
    let pt = Ribbon.translations.page

    let glyph_dialog_content = $(`<div></div>`);
    glyph_dialog_content.append(`<label for="glyph-file">${pt.select_glyph_file}:</label>`);

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

    return glyph_dialog_content
  }

  /**
   * Submits a new glyph to the server and reloads glyphs if successful
   */
  static submit_new_glyph(content) {
    let selection_rows = content.find(".glyph-element-selection-row");
    selection_rows.trigger("moseleave");

    // Update style in DOM
    let wrapper = content.find(".glyph-wrapper")
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
          alert(Ribbon.translations.page.glyph_upload_error)
          return;
        }
        Admin.load_glyphs();
      }
    })   
  }

  /**
   * Creates and inserts the elements needed to prepare the SVG of a new glyph before
   * it's ready to be uploaded
   */
  static processSVG(glyph_content, element) {
    element.html('');

    let preview = $(`<div class="glyph-wrapper"></div>`);
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

    let pt = Ribbon.translations.page
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