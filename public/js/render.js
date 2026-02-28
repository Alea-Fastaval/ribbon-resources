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
  // Custom Alert
  //--------------------------------------------------------------------------------------------------------------------
  static alert(title, text, buttons, cancel_button = true) {
    let gt = Render.translations.general;

    let alert_wrapper = $('<div class="dialog-wrapper closed"></div>');

    //Open
    alert_wrapper.open = function() {
      alert_wrapper.removeClass('closed');
      alert_wrapper.addClass('open');
    }

    // Close
    alert_wrapper.close = function() {
      alert_wrapper.removeClass('open');
      alert_wrapper.addClass('closed');
    }

    // Content
    let alert = $('<div class="dialog"></div>');
    alert_wrapper.append(alert);

    let alert_header = $(`
      <div class="dialog-header">
        <div class="dialog-title">${title}</div>
      </div>
    `);
    alert.append(alert_header);

    let alert_close_icon = $('<div class="dialog-close-icon"></div>');
    alert_header.append(alert_close_icon);

    let alert_content = $(`<div class="dialog-content"></div>"`);
    alert_content.append(text);
    alert.append(alert_content);

    let alert_footer = $('<div class="dialog-footer"></div>');
    alert.append(alert_footer);

    alert_close_icon.on('click', () => {
      alert_wrapper.close();
    })

    if (buttons == undefined || !Array.isArray(buttons)) {
      let ok_button = $(`<div class="dialog-button" >${gt.ok}</div>`);
      alert_footer.append(ok_button);
      ok_button.on('click', () => {alert_wrapper.close()});
      return alert_wrapper;
    }

    if (cancel_button) {
      let cancel_button = $(`<div class="dialog-button" >${gt.cancel}</div>`);
      alert_footer.append(cancel_button);
      cancel_button.on('click', () => {alert_wrapper.close()});
    }

    for (const button of buttons) {
      alert_footer.append(button);
    }

    return alert_wrapper;
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
  static ribbon(info) {
    let ribbon_element = $(
    `<div class="ribbon-wrapper" ribbon-id="${info.ID}">
      <div class="ribbon-info"><div class="info-text">${info.desc}</div></div>
      <div class="ribbon" ribbon-id="${info.ID}"><img src="/api/ribbons/svg/${info.ID}?v=${Ribbon.rv}"></div>
      <div class="ribbon-label">${info.name}</div>
    </div>`);

    return ribbon_element;
  }

  //--------------------------------------------------------------------------------------------------------------------
  // number dial
  //--------------------------------------------------------------------------------------------------------------------
  static number_dial(name, initial = 0) {
    let dial_wrapper = $(`<div class="number-dial-wrapper"></div>`);

    let number_input = $(`<input class="number-dial-value" type="number" value="${initial}" initial-value="${initial}" name="${name}" min="0" maxlength="2" size="2" />`)

    let increase_button = $('<button class="number-dial-button number-dial-increase-button">+</button>');
    increase_button.on('click', () => {
      let value = parseInt(number_input.val());
      value = isNaN(value) ? 0 : value;
      number_input.val(value + 1);
      number_input.change();
    });

    let decrease_button = $('<button class="number-dial-button number-dial-decrease-button">-</button>');
    decrease_button.on('click', () => {
      let value = parseInt(number_input.val());
      value = isNaN(value) ? 1 : value;
      number_input.val(value - 1);
      number_input.change();
    });

    dial_wrapper.append(decrease_button);
    dial_wrapper.append(number_input);
    dial_wrapper.append(increase_button);
    dial_wrapper.append(`<span class="ribbon-year-label">${Render.translations.page.years}</span>`);

    return dial_wrapper;
  }

  //--------------------------------------------------------------------------------------------------------------------
  // Full ribbon display preview
  //--------------------------------------------------------------------------------------------------------------------
  static preview() {
    let orders = Ribbon.orders.list ?? {}

    let preview = $('<div class="ribbon-preview"></div>')
    let order_entries = Object.entries(orders)
    
    if (order_entries.length == 0) {
      preview.html(Ribbon.translations.page.no_ribbons);
      return preview;
    }

    // Sort orders by position
    let sorted = [];
    for (const [_ ,order] of order_entries) {
      sorted[order.position] = order;
    }

    // Add ribbons from order
    for (const order of sorted) {
      let ribbon_element = Render.single_preview(order);
      preview.append(ribbon_element);
    }
    return preview;
  }

  static single_preview(order) {
    let ribbon = Ribbon.ribbon_by_id[order.ribbon_id];

    let years = order.grunt;
    let extra_params = "";
    if (!ribbon.NoWings) {
      if (order.second) {
        years += order.second;
        extra_params += "&second="+order.second;
      }
      if (order.leader) {
        years += order.leader;
        extra_params += "&leader="+order.leader;
      }
    }

    let img_src = `/api/ribbons/svg/${ribbon.ID}?seniority=${years}&v=${Ribbon.rv}` + extra_params;
    return $(`<div class="ribbon" ribbon-id="${ribbon.ID}"><img draggable="false" src="${img_src}"></div>`);
  }
}