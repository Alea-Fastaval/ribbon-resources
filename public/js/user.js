"use strict";

$(function() {

  let resources = {
    categories: {},
    ribbons: {},
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
        let grunt = Render.number_dial('grunt');
        grunt.css('grid-column', 2);
        grunt.attr('ribbon-id', ribbon.ID);
        ribbon_list.append(grunt);

        if (ribbon.NoWings === false) {
          let second = Render.number_dial('second');
          second.css('grid-column', 3);
          second.attr('ribbon-id', ribbon.ID);
          ribbon_list.append(second);

          let leader = Render.number_dial('leader');
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

        inputs.each((index, element) => {
          $(element).attr('initial-value', data[$(element).attr('name')]);
        });
      },
      error: function() {
        alert(Ribbon.translations.page.ribbon_submit_error);
      }
    });
  }
}