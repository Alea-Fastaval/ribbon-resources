"use strict";

class Ribbon {
  static translations = {}
  static category_by_id = {}

  static rv = 1 // Ribbon version for cache

  static load_resources(resources_loaded_callback, list, path, into = Ribbon, keys = []) {
    Ribbon.pending_list = list;
    Ribbon.load(resources_loaded_callback, list, path, into, keys);
  }

  static load(resources_loaded_callback, list, path, into = Ribbon, keys = []) {
    for (const key in list) {
      if (list[key]._sub_list) {
        into[key] = into[key] ?? {};
        Ribbon.load(resources_loaded_callback, list[key], path+key+'/', into[key], [...keys, key]);
        continue;
      }

      if (key == "_sub_list") continue;

      let target = list[key].into ?? into;
      let field = list[key].field ?? key;
      let url = list[key].url ?? path+key;
      let data_field = list[key].data_field;
  
      $.ajax({
        url,
        success: function(data, status) {
          if (data.status == "error") {
            Ribbon.load_error(key);
            return;
          }
          target[field] = data_field ? data[data_field] : data;
          
          Ribbon.resource_loaded(resources_loaded_callback, key, keys);
        },
        error: function() {
          Ribbon.load_error(key);
        }
      }) 
    }
  }

  static load_error(key) {
    let message
    if (Ribbon.translations.page != undefined && Ribbon.translations.page.resource_load_failed != undefined) {
      message = Ribbon.translations.page.resource_load_failed.replace("{}", key);
    } else {
      message = "Could not load resource: " + key;
    }
    alert(message);
  }

  static resource_loaded(resources_loaded_callback, key, keys, list = Ribbon.pending_list, level = 0) {
    if (keys.length != 0) {
      let sub_keys = [...keys];
      let sub_key = sub_keys.shift();
      Ribbon.resource_loaded(resources_loaded_callback, key, sub_keys, list[sub_key], level + 1);

      if (Object.keys(list[sub_key]).length == 1) {
        delete list[sub_key];
      }
        
    } else {
      delete list[key];
    }

    if (level == 0 && Object.keys(list).length == 0) {
      Ribbon.create_lookups();
      resources_loaded_callback();
    }
  }

  static create_lookups() {
    if (Ribbon.categories) {
      Ribbon.category_by_id = {};
      for (const category of Ribbon.categories) {
        Ribbon.category_by_id[category.ID] = category;
      }
    }

    if (Ribbon.ribbons) {
      Ribbon.ribbon_by_id = {};
      for (const [category, list] of Object.entries(Ribbon.ribbons)) {
        for (const ribbon of list) {
          Ribbon.ribbon_by_id[ribbon.ID] = ribbon;
        }
      }
    }
  }
}