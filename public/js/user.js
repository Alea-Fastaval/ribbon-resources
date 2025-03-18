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

      //-------------------------------------------
      // Render Ribbons
      //-------------------------------------------
      if (Ribbon.ribbons[category.ID]) for (const ribbon of Ribbon.ribbons[category.ID]) {
        ribbon.name = Ribbon.translations.ribbons[ribbon.ID].name;
        ribbon.desc = Ribbon.translations.ribbons[ribbon.ID].desc;
        let ribbon_element = Render.ribbon(ribbon, category);
        ribbon_list.append(ribbon_element);
      }
    }
  }
}