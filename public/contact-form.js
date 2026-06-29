(function () {
  "use strict";

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function getField(form, name) {
    var input = form.querySelector('[name="' + name + '"]');
    return input ? String(input.value || "").trim() : "";
  }

  function showFormMessage(form, text, type) {
    var widget = form.closest(".elementor-widget-form");
    if (!widget) {
      return;
    }

    var existing = widget.querySelector(".ronicas-contact-form-message");
    if (existing) {
      existing.remove();
    }

    var box = document.createElement("div");
    box.className =
      "ronicas-contact-form-message ronicas-contact-form-message--" + type;
    box.textContent = text;
    widget.insertBefore(box, form);
  }

  ready(function () {
    var forms = document.querySelectorAll("form.elementor-form");
    if (!forms.length) {
      return;
    }

    forms.forEach(function (form) {
      if (!form.querySelector('[name="form_fields[email]"]')) {
        return;
      }

      form.addEventListener("submit", function (event) {
        event.preventDefault();

        var submitButton = form.querySelector('button[type="submit"]');
        var originalText = submitButton
          ? submitButton.textContent
          : "Submit";

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = "Sending...";
        }

        var payload = {
          first_name: getField(form, "form_fields[name]"),
          last_name: getField(form, "form_fields[field_1e45323]"),
          email: getField(form, "form_fields[email]"),
          phone: getField(form, "form_fields[field_bd8ab05]"),
          subject: getField(form, "form_fields[field_c10f26c]"),
          message: getField(form, "form_fields[message]"),
        };

        fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })
          .then(function (response) {
            return response.json().then(function (data) {
              return { ok: response.ok, data: data };
            });
          })
          .then(function (result) {
            if (!result.ok || !result.data.success) {
              throw new Error(
                result.data && result.data.message
                  ? result.data.message
                  : "Could not send your message."
              );
            }

            showFormMessage(form, result.data.message, "success");
            form.reset();
          })
          .catch(function (error) {
            showFormMessage(
              form,
              error && error.message
                ? error.message
                : "Could not send your message. Please try again.",
              "error"
            );
          })
          .finally(function () {
            if (submitButton) {
              submitButton.disabled = false;
              submitButton.textContent = originalText;
            }
          });
      });
    });
  });
})();
