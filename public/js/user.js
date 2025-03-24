"use strict";

$(function() {

  let resources = {
    categories: {},
    ribbons: {},
    orders: {},
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

    //-------------------------------------------
    // Preview Section
    //-------------------------------------------
    UserPage.preview_section = $('#preview-section');
    UserPage.preview_section.append(`<h3>${Ribbon.translations.page.preview}:</h3>`);

    // Column slider
    UserPage.preview_section.append(`<p>${Ribbon.translations.page.width}:</p>`);
    let column_selection = $(`<input class="column-select" type="range" min="1" max="5" step="1">`)
    UserPage.preview_section.append(column_selection);

    // Visual preview
    let preview = Render.preview(Ribbon.orders.list);
    UserPage.preview_section.append(preview);
    UserPage.init_preview_dragging(preview);

    // Adjust width
    column_selection.on('input', () => {
      $('body').css({'--ribbon-columns': column_selection.val()});
    });
    column_selection.on('change', () => {
      UserPage.set_columns(column_selection.val())
    });
    column_selection.val(Ribbon.orders.settings.columns);
    column_selection.trigger("input");

    UserPage.preview_section.append(`<p>${Ribbon.translations.page.sorting}:</p>`);

    //-------------------------------------------
    // Selection Section
    //-------------------------------------------
    UserPage.selection_section = $('#selection-section');
    UserPage.selection_section.append(`<h3>${Ribbon.translations.page.selection_header}:</h3>`);

    //-------------------------------------------
    // Render Categories
    //-------------------------------------------
    for (const category of Ribbon.categories) {
      category.name = Ribbon.translations.categories[category.ID]
      let category_element = Render.category(category, 'closed');
      category_element.attr('cat-id', category.ID);
      UserPage.selection_section.append(category_element);  

      let ribbon_list = category_element.find(".folding-section-content");
      ribbon_list.addClass('ribbon-list');


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
        let order = Ribbon.orders.list[ribbon.ID] ?? {}

        // Ribbon info
        ribbon.name = Ribbon.translations.ribbons[ribbon.ID].name;
        ribbon.desc = Ribbon.translations.ribbons[ribbon.ID].desc;
        let ribbon_element = Render.ribbon(ribbon);
        ribbon_element.css('grid-column', 1);
        ribbon_list.append(ribbon_element);

        function update_list_preview(values) {
          let old_ribbon = ribbon_element.find(".ribbon");
          let new_ribbon = Render.single_preview(values);
          new_ribbon.insertBefore(old_ribbon);
          old_ribbon.remove();
        }

        // Set preview
        if (Ribbon.orders.list[ribbon.ID]) {
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
        delete_button.prop('disabled', Ribbon.orders.list[ribbon.ID] == undefined);
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
        if (Ribbon.orders.list[ribbon.ID]) {
          grunt.find('input').change();
        }
      }
    }
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
    let old_preview = UserPage.preview_section.find('.ribbon-preview-wrapper');
    let new_preview = Render.preview(Ribbon.orders.list);

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
          console.log("Error moving ribbon selection:", result)
          return;
        }
      },
      error: function() {
        alert(Ribbon.translations.page.ribbon_column_error);
      }
    });
  }
}