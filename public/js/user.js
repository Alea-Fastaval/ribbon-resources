"use strict";

$(function() {

  let resources = {
    categories: {},
    ribbons: {},
    orders: {},
    options: {},
    translations: {
      _sub_list: true,
      page: {
        url: `/api/translations/${page_info.lang}/user/`,
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

  Ribbon.load_resources(() => {UserPage.render_page()}, resources, "/api/");
});

class UserPage {
  static preview_section
  static selection_section

  static render_page() {
    Render.init(Ribbon.translations);
    let pt = Ribbon.translations.page;
    let gt = Ribbon.translations.general;
    let settings = Ribbon.orders.settings ?? {}

    //-------------------------------------------
    // Notice Section
    //-------------------------------------------
    if (Ribbon.options.show_closed_message == 'true') {
      let waning = $(`<h2 class="warning">${pt.closed_message}</h2>`)
      waning.insertAfter($('.main-content h1'))
    }

    //-------------------------------------------
    // Reset section
    //-------------------------------------------
    let reset_section = $('#reset-section')
    let clean_section = $('<div id="clean-section"></div>')
    reset_section.append(clean_section)
    
    let copy_text = $(`<p>${pt.clean}</p>`)
    clean_section.append(copy_text)

    let copy_button = $(`<div class="action-button">${pt.earlier_year} ${Ribbon.orders.settings.latest_year}</div>`)
    copy_button.on('click', () => { UserPage.copy_order(Ribbon.orders.settings.latest_user)})
    clean_section.append(copy_button)

    let skip_button = $(`<div class="action-button">${pt.blank}</div>`)
    skip_button.on('click', () => { UserPage.skip_copy()})
    clean_section.append(skip_button)

    let reset_button = $(`<div id="reset-button" class="action-button">${pt.reset}</div>`)
    reset_button.on('click', () => { UserPage.reset_order()})
    reset_section.append(reset_button)

    if (Ribbon.orders.settings.status == "clean" && Ribbon.orders.settings.latest_user) {
      clean_section.show()
      reset_button.hide()
    } else {
      clean_section.hide()
      reset_button.show()
    }

    //-------------------------------------------
    // Preview Section
    //-------------------------------------------
    UserPage.preview_section = $('#preview-section');
    UserPage.preview_section.append(`<h3>${pt.preview}:</h3>`);

    // Content section for positioning
    let preview_content1 = $('<div class="preview-content"></div>');
    UserPage.preview_section.append(preview_content1);

    // Top explanation
    let text_wrapper = $('<div class="preview-text-wrapper"></div>');
    preview_content1.append(text_wrapper);

    text_wrapper.append(`<p class="explanation-text">${pt.width}</p>`);
    text_wrapper.append(`<p class="explanation-text">${pt.sorting}</p>`);

    // GUI elements wrapper
    let preview_wrapper = $('<div class="ribbon-preview-wrapper"></div>');
    preview_content1.append(preview_wrapper);

    // Column slider
    let column_selection = $(`<input class="column-select" type="range" min="1" max="5" step="1">`)
    preview_wrapper.append(column_selection);
    
    // Column slider logic
    column_selection.on('input', () => {
      $('body').css({'--ribbon-columns': column_selection.val()});
    });
    column_selection.on('change', () => {
      UserPage.set_columns(column_selection.val())
    });
    column_selection.val(settings.columns);
    column_selection.trigger("input");

    // Visual preview
    let preview = Render.preview();
    preview_wrapper.append(preview);

    // Ordering logic
    UserPage.init_preview_dragging(preview);

    let preview_content2 = $('<div class="preview-content"></div>');
    UserPage.preview_section.append(preview_content2);

    // Bottom explanation text
    preview_content2.append(`<p class="explanation-text">${pt.lock}</p>`);

    let preview_wrapper2 = $('<div class="ribbon-preview-wrapper"></div>');
    preview_content2.append(preview_wrapper2);

    // Lock button
    let locked = settings.status != "open";
    let locked_button = $(`<button class="lock-button" locked="${locked}"></button>`)
    preview_wrapper2.append(locked_button);

    // Lock button logic
    locked_button.on('click', () => {
      let locked = locked_button.attr("locked") == "true";
      locked_button.attr("locked", !locked);
      UserPage.set_status(locked ? "open" : "closed") // Setting new status depending on old one
    });


    //-------------------------------------------
    // Selection Section
    //-------------------------------------------
    UserPage.selection_section = $('#selection-section');
    UserPage.selection_section.append(`<h3>${pt.selection_header}:</h3>`);
    UserPage.selection_section.append(`<p class="ribbon-explanation">${pt.explanation}</p>`);

    //-------------------------------------------
    // Render Categories
    //-------------------------------------------
    for (const category of Ribbon.categories) {
      category.name = Ribbon.translations.categories[category.ID]
      let category_element = Render.category(category, 'closed');
      category_element.attr('cat-id', category.ID);
      UserPage.selection_section.append(category_element);  

      let ribbon_list = category_element.find(".folding-section-content");

      let header_texts = [
        'grunt',
        'second',
        'leader',
        'total',
      ];

      let column = 2
      for (const text of header_texts) {
        let header_element = $(`<div class="ribbon-list-header">${pt[text]}</div>`)
        header_element.css('grid-column', column++)
        ribbon_list.append(header_element)
      }

      //-------------------------------------------
      // Render Ribbons
      //-------------------------------------------
      if (Ribbon.ribbons[category.ID]) for (const ribbon of Ribbon.ribbons[category.ID]) {
        // Get current ribbon order
        let orders = Ribbon.orders.list ?? {} 
        let order = orders[ribbon.ID] ?? {}

        // Set category as open if we have orders inside
        if (orders[ribbon.ID]) {
          category_element.removeClass('closed');
          category_element.addClass('open');
          category_element.find('.folding-section-content').show();
        }

        // Ribbon info
        ribbon.name = Ribbon.translations.ribbons[ribbon.ID].name;
        ribbon.desc = Ribbon.translations.ribbons[ribbon.ID].desc;
        let ribbon_element = Render.ribbon(ribbon);
        ribbon_list.append(ribbon_element);

        function update_list_preview(values) {
          let old_ribbon = ribbon_element.find(".ribbon");
          let new_ribbon = Render.single_preview(values);
          new_ribbon.insertBefore(old_ribbon);
          old_ribbon.remove();
        }

        // Set preview
        if (orders[ribbon.ID]) {
          update_list_preview(order);
        }

        // Number dials
        let grunt = Render.number_dial('grunt', order.grunt);
        grunt.css('grid-column', 2);
        grunt.attr('ribbon-id', ribbon.ID);
        ribbon_list.append(grunt);

        if (ribbon.NoWings === false) {
          let second = Render.number_dial('second', order.second);
          second.css('grid-column', 3);
          second.attr('ribbon-id', ribbon.ID);
          ribbon_list.append(second);

          let leader = Render.number_dial('leader', order.leader);
          leader.css('grid-column', 4);
          leader.attr('ribbon-id', ribbon.ID);
          ribbon_list.append(leader);
        }

        // Total years
        let total_element = $(`<div class="ribbon-list-total"></div>`);
        total_element.css('grid-column', 5);
        total_element.attr('ribbon-id', ribbon.ID);
        ribbon_list.append(total_element);

        // Save button
        let save_button = $(`<button class="ribbon-list-save-button">${gt.save}</button>`);
        save_button.css('grid-column', 6);
        save_button.attr('ribbon-id', ribbon.ID);
        save_button.prop('disabled', true);
        ribbon_list.append(save_button);
        save_button.on("click", () => {
          save_button.prop('disabled', true);
          UserPage.submit_order(ribbon.ID);
        });
        
        // Delete button
        let delete_button = $(`<button class="ribbon-list-delete-button">${gt.delete}</button>`);
        delete_button.css('grid-column', 7);
        delete_button.attr('ribbon-id', ribbon.ID);
        delete_button.prop('disabled', orders[ribbon.ID] == undefined);
        ribbon_list.append(delete_button);
        delete_button.on("click", () => {
          delete_button.prop('disabled', true);
          UserPage.delete_order(ribbon.ID);
        });

        // Calculate total and update single_preview
        let inputs = $(`.number-dial-wrapper[ribbon-id=${ribbon.ID}] input`);
        inputs.on('change', () => {
          let total = 0;
          let change = false;
          let values = {ribbon_id: ribbon.ID};
          inputs.each((index, element) => {
            if ($(element).val() != $(element).attr('initial-value')) change = true;
            let value = parseInt($(element).val());
            value = isNaN(value) ? 0 : value;
            values[$(element).attr("name")] = value;
            total += value;
          });
          total_element.html(total == 0 ? "" : total + " " + pt.years);
          update_list_preview(values);
          save_button.prop('disabled', !change);
        });

        // Update totals and preview if we have an existing order
        if (orders[ribbon.ID]) {
          grunt.find('input').change();
        }
      }
    }
  }

  static copy_order(user_id) {
    $.ajax({
      url: '/api/orders/copy',
      method: 'POST',
      data: {
        user_id
      },
      success: function(result, status) {
        if (result.status != "success") {
          let text = Ribbon.translations.page.ribbon_copy_error;
          if (result.message) {
            text += "\n"+message;
          }
          alert(text);
          console.log("Error copying ribbon order:", result)
          return;
        }
        
        window.location = window.location.href;
      },
      error: function(jqXHR) {
        let text = Ribbon.translations.page.ribbon_copy_error;
        if (jqXHR.responseText) {
          let response = JSON.parse(jqXHR.responseText)
          if (response && response.message) {
            text += "\n" + response.message;
          }
        }
        alert(text);
      }
    })
  }

  static skip_copy() {
    $('#clean-section').hide()
    $('#reset-button').show()
    UserPage.set_status('open')
  }

  static reset_order() {
    if (!confirm(Ribbon.translations.page.reset_confirm)) return

    $.ajax({
      url: '/api/orders',
      method: 'DELETE',
      success: function(result, status) {
        if (result.status != "success") {
          let text = Ribbon.translations.page.ribbon_reset_error;
          if (result.message) {
            text += "\n"+message;
          }
          alert(text);
          console.log("Error resetting ribbon order:", result)
          return;
        }

        window.location = window.location.href;
      },
      error: function(jqXHR) {
        let text = Ribbon.translations.page.ribbon_reset_error;
        if (jqXHR.responseText) {
          let response = JSON.parse(jqXHR.responseText)
          if (response && response.message) {
            text += "\n" + response.message;
          }
        }
        alert(text);
      }
    })
  }

  static submit_order(ribbon_id) {
    let data = {ribbon: ribbon_id}
    let inputs = UserPage.selection_section.find(`.number-dial-wrapper[ribbon-id=${ribbon_id}] input`);
    inputs.each((index, element) => {
      data[$(element).attr('name')] = $(element).val();
    });

    $.ajax({
      url: '/api/orders',
      method: 'POST',
      data,
      success: function(result, status) {
        if (result.status != "success") {
          let text = Ribbon.translations.page.ribbon_submit_error;
          if (result.message) {
            text += "\n"+message;
          }
          alert(text);
          console.log("Error saving ribbon selection:", result)
          return;
        }

        // Reinitialize number dials
        inputs.each((index, element) => {
          $(element).attr('initial-value', data[$(element).attr('name')]);
        });

        // Enable the delete button
        UserPage.selection_section.find(`.ribbon-list-delete-button[ribbon-id=${ribbon_id}]`).prop("disabled", false);

        // Refresh the preview
        Ribbon.load_resources(() => {UserPage.reload_preview()}, {orders: {}}, "/api/");
      },
      error: function(jqXHR) {
        let text = Ribbon.translations.page.ribbon_submit_error;
        if (jqXHR.responseText) {
          let response = JSON.parse(jqXHR.responseText)
          if (response && response.message) {
            text += "\n" + response.message;
          }
        }
        alert(text);
      }
    });
  }

  static delete_order(ribbon_id) {
    $.ajax({
      url: '/api/orders/'+ribbon_id,
      method: 'DELETE',
      success: function(result, status) {
        if (result.status != "success") {
          let text = Ribbon.translations.page.ribbon_delete_error;
          if (result.message) {
            text += "\n"+message;
          }
          alert(text);
          console.log("Error deleting ribbon selection:", result)
          return;
        }

        // Reset number dials
        let inputs = UserPage.selection_section.find(`.number-dial-wrapper[ribbon-id=${ribbon_id}] input`);
        inputs.each((index, element) => {
          $(element).attr('initial-value', 0);
          $(element).val(0);
        });

        // Clear total and preview
        UserPage.selection_section.find(`.ribbon-list-total[ribbon-id=${ribbon_id}]`).html("");
        let old_ribbon = UserPage.selection_section.find(`.ribbon-wrapper[ribbon-id=${ribbon_id}] .ribbon`);
        let new_ribbon = Render.single_preview({ribbon_id, grunt: 0});
        new_ribbon.insertBefore(old_ribbon);
        old_ribbon.remove();

        // Refresh top preview
        Ribbon.load_resources(() => {UserPage.reload_preview()}, {orders: {}}, "/api/");
      },
      error: function(jqXHR) {
        let text = Ribbon.translations.page.ribbon_delete_error;
        if (jqXHR.responseText) {
          let response = JSON.parse(jqXHR.responseText)
          if (response && response.message) {
            text += "\n" + response.message;
          }
        }
        alert(text);
      }
    });
  }

  static reload_preview() {
    let old_preview = UserPage.preview_section.find('.ribbon-preview');
    let new_preview = Render.preview();

    new_preview.insertBefore(old_preview);
    old_preview.remove();

    UserPage.init_preview_dragging(new_preview);
  }

  static init_preview_dragging(preview) {
    UserPage.dragging = undefined
    
    $(window).on("mouseup", () => {
      if (UserPage.dragging == undefined) return;
      UserPage.submit_move(UserPage.dragging);
      UserPage.dragging.css("opacity", "");
      UserPage.dragging = undefined;
    });

    let ribbons = preview.find(".ribbon");
    ribbons.on("mousedown", (evt) => {
      UserPage.dragging = $(evt.delegateTarget);
      UserPage.dragging.css("opacity", "50%");
      evt.preventDefault();
    });

    ribbons.on("mouseenter", (evt) => {
      if (UserPage.dragging == undefined) return;

      let target = $(evt.delegateTarget);

      if (target.index() > UserPage.dragging.index()) {
        UserPage.dragging.insertAfter(target);
      } else {
        UserPage.dragging.insertBefore(target);
      }
    })
  }

  static submit_move(ribbon_element) {
    let data = {
      ribbon: ribbon_element.attr("ribbon-id"),
      position: ribbon_element.index()
    }

    $.ajax({
      url: '/api/orders',
      method: 'POST',
      data,
      success: function(result, status) {
        if (result.status != "success") {
          let text = Ribbon.translations.page.ribbon_move_error;
          if (result.message) {
            text += "\n"+message;
          }
          alert(text);
          console.log("Error moving ribbon selection:", result)
          return;
        }

        Ribbon.load_resources(() => {UserPage.reload_preview()}, {orders: {}}, "/api/");
      },
      error: function(jqXHR) {
        let text = Ribbon.translations.page.ribbon_move_error;
        if (jqXHR.responseText) {
          let response = JSON.parse(jqXHR.responseText)
          if (response && response.message) {
            text += "\n" + response.message;
          }
        }
        alert(text);
      }
    });
  }

  static set_columns(columns) {
    $.ajax({
      url: '/api/orders/columns',
      method: 'POST',
      data: {
        value: columns
      },
      success: function(result, status) {
        if (result.status != "success") {
          alert(Ribbon.translations.page.ribbon_column_error);
          console.log("Error setting columns:", result)
          return;
        }
      },
      error: function() {
        alert(Ribbon.translations.page.ribbon_column_error);
      }
    });
  }

  static set_status(status) {
    $.ajax({
      url: '/api/orders/status',
      method: 'POST',
      data: {
        value: status
      },
      success: function(result, status) {
        if (result.status != "success") {
          alert(Ribbon.translations.page.ribbon_status_error);
          console.log("Error setting status:", result)
          return;
        }
      },
      error: function() {
        alert(Ribbon.translations.page.ribbon_status_error);
      }
    });
  }
}