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
    UserPage.preview_section.append(`<p>${Ribbon.translations.page.sorting}:</p>`);

    let preview = Render.preview(Ribbon.orders);
    UserPage.preview_section.append(preview);
    UserPage.init_preview_dragging(preview);

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
        // Ribbon info
        ribbon.name = Ribbon.translations.ribbons[ribbon.ID].name;
        ribbon.desc = Ribbon.translations.ribbons[ribbon.ID].desc;
        let ribbon_element = Render.ribbon(ribbon, category);
        ribbon_element.css('grid-column', 1);
        ribbon_list.append(ribbon_element);

        // Number dials
        let order = Ribbon.orders[ribbon.ID] ?? {}
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

        // Preview
        
        // Save button
        let save_button = $(`<button class="ribbon-list-save-button">${gt.save}</button>`);
        save_button.css('grid-column', 7);
        save_button.attr('ribbon-id', ribbon.ID);
        save_button.prop('disabled', true);
        ribbon_list.append(save_button);
        save_button.on("click", () => {
          save_button.prop('disabled', true);
          UserPage.submit_order(ribbon.ID);
        });
        
        // Delete button
        let delete_button = $(`<button class="ribbon-list-delete-button">${gt.delete}</button>`);
        delete_button.css('grid-column', 8);
        delete_button.attr('ribbon-id', ribbon.ID);
        delete_button.prop('disabled', Ribbon.orders[ribbon.ID] == undefined);
        ribbon_list.append(delete_button);
        delete_button.on("click", () => {
          delete_button.prop('disabled', true);
          UserPage.delete_order(ribbon.ID);
        });

        // Calculate total
        let inputs = $(`.number-dial-wrapper[ribbon-id=${ribbon.ID}] input`);
        inputs.on('change', () => {
          let total = 0;
          let change = false;
          inputs.each((index, element) => {
            if ($(element).val() != $(element).attr('initial-value')) change = true;
            let value = parseInt($(element).val());
            total += isNaN(value) ? 0 : value;
          });
          total_element.html(total == 0 ? "" : total + " " + pt.years);
          save_button.prop('disabled', !change);
        });
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
          alert(Ribbon.translations.page.ribbon_submit_error);
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
      error: function() {
        alert(Ribbon.translations.page.ribbon_submit_error);
      }
    });
  }

  static delete_order(ribbon_id) {
    $.ajax({
      url: '/api/orders/'+ribbon_id,
      method: 'DELETE',
      success: function(result, status) {
        if (result.status != "success") {
          alert(Ribbon.translations.page.ribbon_delete_error);
          console.log("Error deleting ribbon selection:", result)
          return;
        }

        let inputs = UserPage.selection_section.find(`.number-dial-wrapper[ribbon-id=${ribbon_id}] input`);
        inputs.each((index, element) => {
          $(element).attr('initial-value', 0);
          $(element).val(0);
        });

        Ribbon.load_resources(() => {UserPage.reload_preview()}, {orders: {}}, "/api/");
      },
      error: function() {
        alert(Ribbon.translations.page.ribbon_delete_error);
      }
    });
  }

  static reload_preview() {
    let old_preview = UserPage.preview_section.find('.ribbon-preview-wrapper');
    let new_preview = Render.preview(Ribbon.orders);

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
          alert(Ribbon.translations.page.ribbon_move_error);
          console.log("Error moving ribbon selection:", result)
          return;
        }

        Ribbon.load_resources(() => {UserPage.reload_preview()}, {orders: {}}, "/api/");
      },
      error: function() {
        alert(Ribbon.translations.page.ribbon_move_error);
      }
    });
  }
}