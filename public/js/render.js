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

  static dialog(title, content, callback) {
    let dialog_wrapper = $('<div class="dialog-wrapper closed"></div>');

    dialog_wrapper.open = function() {
      dialog_wrapper.removeClass('closed');
      dialog_wrapper.addClass('open');
    }

    dialog_wrapper.close = function() {
      dialog_wrapper.removeClass('open');
      dialog_wrapper.addClass('closed');
    }

    let dialog = $('<div class="dialog"></div>');
    dialog_wrapper.append(dialog);

    let dialog_header = $(`
      <div class="dialog-header">
        <div class="dialog-title">${title}</div>
      </div>
    `);
    dialog.append(dialog_header);

    let dialog_close_icon = $('<div class="dialog-close-icon"></div>');
    dialog_header.append(dialog_close_icon);

    if (content instanceof jQuery) {
      content.addClass('dialog-content')
    } else {
      content ??= "";
      content = $(`<div class="dialog-content">${content}</div>"`);
    }
    dialog.append(content);

    let dialog_footer = $('<div class="dialog-footer"></div>');
    dialog.append(dialog_footer);

    let gt = Admin.translations.general;
    let ok_button = $(`<div class="dialog-button" tabindex="0">${gt.ok}</div>`);
    dialog_footer.append(ok_button);

    let cancel_button = $(`<div class="dialog-button" tabindex="0">${gt.cancel}</div>`);
    dialog_footer.append(cancel_button);

    dialog_close_icon.on('click', () => {dialog_wrapper.close()})
    cancel_button.on('click keydown', (evt) => {
      // Only capture Enter and Space
      if (evt.type == 'keydown' && evt.which !== 13 && evt.which != 32) return;

      dialog_wrapper.close()}
    )

    ok_button.on('click keydown', (evt) => {
      // Only capture Enter and Space
      if (evt.type == 'keydown' && evt.which !== 13 && evt.which != 32) return;

      dialog_wrapper.close();
      callback(content)
    })

    return dialog_wrapper
  }

  static category(info) {
    let new_category = Render.foldingSection(info.name, info.content);
    let header = new_category.find(".folding-section-header");
    header.css({
      "background-color": info.Background,
      "--stripes-color": info.Stripes,
      "color": info.Glyph,
    })

    new_category.addClass('category');

    return new_category;
  }
}