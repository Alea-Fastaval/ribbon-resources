"use strict";

class Render {
  
  static foldingSection(header_text, content) {
    content ??= "";

    let section = $(`<div class="folding-section open"></div>`);
    
    let header_element = $(`<div class="folding-section-header"></div>`);
    section.append(header_element);

    let header_label = $(`<div class="folding-section-header-label">${header_text}</div>`);
    header_element.append(header_label);

    let header_icon = $(`<div class="folding-section-header-icon"></div>`);
    header_element.append(header_icon);

    let content_wrapper = $(`<div class="folding-section-content">${content}</div>"`);
    section.append(content_wrapper);

    header_element.on("click", () => {
      content_wrapper.toggle()
      if (content_wrapper.is(":visible")) {
        section.addClass("open");
        section.removeClass("closed");
      } else {
        section.addClass("closed");
        section.removeClass("open");
      }
    });

    return section
  }
}