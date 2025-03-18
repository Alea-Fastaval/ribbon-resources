"use strict";

class Render {
  static init(translations) {
    Render.translations = translations;
  }

  //--------------------------------------------------------------------------------------------------------------------
  // Folding section
  //--------------------------------------------------------------------------------------------------------------------
  static foldingSection(header_text, content, default_state = "open") {
    let section = $(`<div class="folding-section ${default_state}"></div>`);
    
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

    if (default_state === "closed") {
      content.hide();
    }

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

  //--------------------------------------------------------------------------------------------------------------------
  // Dialog
  //--------------------------------------------------------------------------------------------------------------------
  static dialog(title, content) {
    let dialog_wrapper = $('<div class="dialog-wrapper closed"></div>');

    /**
     * Listeners
     */
    dialog_wrapper._on = dialog_wrapper.on
    dialog_wrapper.listeners = {};
    dialog_wrapper.on = function(evt_name, callback) {
      let supported = [
        "ok",
        "cancel",
        "open",
      ];

      if (!supported.includes(evt_name)) {
        dialog_wrapper._on(evt_name, callback);
        return;
      }

      if (Array.isArray(dialog_wrapper.listeners[evt_name])) {
        dialog_wrapper.listeners[evt_name].push(callback);
      } else {
        dialog_wrapper.listeners[evt_name] = [callback];
      }
    }

    dialog_wrapper.trigger = function(evt_name) {
      if (!Array.isArray(dialog_wrapper.listeners[evt_name])) return;

      for (const callback of dialog_wrapper.listeners[evt_name]) {
        callback(content);
      }
    }

    /**
     * Open/close
     */
    dialog_wrapper.open = function() {
      dialog_wrapper.trigger('open');

      dialog_wrapper.removeClass('closed');
      dialog_wrapper.addClass('open');
    }

    dialog_wrapper.close = function() {
      dialog_wrapper.removeClass('open');
      dialog_wrapper.addClass('closed');
    }

    /**
     * Content
     */
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

    /**
     * Fotter & buttons
     */
    let dialog_footer = $('<div class="dialog-footer"></div>');
    dialog.append(dialog_footer);

    let gt = Render.translations.general;
    let ok_button = $(`<div class="dialog-button" tabindex="0">${gt.ok}</div>`);
    dialog_footer.append(ok_button);

    let cancel_button = $(`<div class="dialog-button" tabindex="0">${gt.cancel}</div>`);
    dialog_footer.append(cancel_button);

    dialog_close_icon.on('click', () => {
      dialog_wrapper.close();
      dialog_wrapper.trigger('cancel');
    })
    cancel_button.on('click keydown', (evt) => {
      // Only capture Enter and Space
      if (evt.type == 'keydown' && evt.which !== 13 && evt.which != 32) return;

      dialog_wrapper.close();
      dialog_wrapper.trigger('cancel');
    })

    ok_button.on('click keydown', (evt) => {
      // Only capture Enter and Space
      if (evt.type == 'keydown' && evt.which !== 13 && evt.which != 32) return;

      dialog_wrapper.close();
      dialog_wrapper.trigger('ok');
    })

    return dialog_wrapper
  }

  //--------------------------------------------------------------------------------------------------------------------
  // Category
  //--------------------------------------------------------------------------------------------------------------------
  static category(info, default_state) {
    let new_category = Render.foldingSection(info.name, info.content, default_state);
    new_category.attr({
      id: `category-${info.ID}`,
      bg: info.Background,
      fg: info.Glyph,
    })
    
    new_category.css({
      "--background-color": info.Background,
      "--stripes-color": info.Stripes,
      "--glyph-color": info.Glyph,
    })

    new_category.addClass('category');

    return new_category;
  }

  //--------------------------------------------------------------------------------------------------------------------
  // Ribbon
  //--------------------------------------------------------------------------------------------------------------------
  static ribbon(info, colors) {
    let glyph_src = `/api/glyphs/${info.Glyph}?fg=${encodeURIComponent(colors.Glyph)}&bg=${encodeURIComponent(colors.Background)}`;
    let ribbon_element = $(
    `<div class="ribbon-wrapper">
      <div class="ribbon-info"><div class="info-text">${info.desc}</div></div>
      <div class="ribbon"><img src="${glyph_src}"></div>
      <div class="ribbon-label">${info.name}</div>
    <div>`);

    return ribbon_element;
  }
}