"use strict";

class Render {
  
  static foldingSection(header_text, content) {
    

    let section = $(`<div class="folding-section open"></div>`);
    
    let header_element = $(`<div class="folding-section-header"></div>`);
    section.append(header_element);

    let header_label = $(`<div class="folding-section-header-label">${header_text}</div>`);
    header_element.append(header_label);

    let header_icon = $(`<div class="folding-section-header-icon"></div>`);
    header_element.append(header_icon);

    if (content instanceof jQuery) {
      content.addClass("folding-section-content")
    } else {
      content ??= "";
      content = $(`<div class="folding-section-content">${content}</div>"`);
    }
    section.append(content);

    header_element.on("click", () => {
      content.toggle()
      if (content.is(":visible")) {
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