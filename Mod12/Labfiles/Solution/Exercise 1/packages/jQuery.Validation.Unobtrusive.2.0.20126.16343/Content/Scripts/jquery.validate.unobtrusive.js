/*!
** Unobtrusive validation support library for jQuery and jQuery Validate
** Copyright (C) Microsoft Corporation. All rights reserved.
*/

/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: false */
/*global document: false, jQuery: false */

(function ($) {
    var $jQval = $.validator,
        adapters,
        data_validation = "unobtrusiveValidation";

    function setValidationValues(options, ruleName, value) {
        options.rules[ruleName] = value;
        if (options.message) {
            options.messages[ruleName] = options.message;
        }
    }

    function splitAndTrim(value) {
        return value.replace(/^\s+|\s+$/g, "").split(/\s*,\s*/g);
    }

    function escapeAttributeValue(value) {
        // As mentioned on http://api.jquery.com/category/selectors/
        return value.replace(/([!"#$%&'()*+,./:;<=>?@\[\\\]^`{|}~])/g, "\\$1");
    }

    function getModelPrefix(fieldName) {
        return fieldName.substr(0, fieldName.lastIndexOf(".") + 1);
    }

    function appendModelPrefix(value, prefix) {
        if (value.indexOf("*.") === 0) {
            value = value.replace("*.", prefix);
        }
        return value;
    }

    function onError(error, inputElement) {  // 'this' is the form element
        var container = $(this).find("[data-valmsg-for='" + escapeAttributeValue(inputElement[0].name) + "']"),
            replace = $.parseJSON(container.attr("data-valmsg-replace")) !== false;

        container.removeClass("field-validation-valid").addClass("field-validation-error");
        error.data("unobtrusiveContainer", container);

        if (replace) {
            container.empty();
            error.removeClass("input-validation-error").appendTo(container);
        }
        else {
            error.hide();
        }
    }

    function onErrors(event, validator) {  // 'this' is the form element
        var container = $(this).find("[data-valmsg-summary=true]"),
            list = container.find("ul");

        if (list && list.length && validator.errorList.length) {
            list.empty();
            container.addClass("validation-summary-errors").removeClass("validation-summary-valid");

            $.each(validator.errorList, function () {
                $("<li />").html(this.message).appendTo(list);
            });
        }
    }

    function onSuccess(error) {  // 'this' is the form element
        var container = error.data("unobtrusiveContainer"),
            replace = $.parseJSON(container.attr("data-valmsg-replace"));

        if (container) {
            container.addClass("field-validation-valid").removeClass("field-validation-error");
            error.removeData("unobtrusiveContainer");

            if (replace) {
                container.empty();
            }
        }
    }

    function onReset(event) {  // 'this' is the form element
        var $form = $(this);
        $form.data("validator").resetForm();
        $form.find(".validation-summary-errors")
            .addClass("validation-summary-valid")
            .removeClass("validation-summary-errors");
        $form.find(".field-validation-error")
            .addClass("field-validation-valid")
            .removeClass("field-validation-error")
            .removeData("unobtrusiveContainer")
            .find(">*")  // If we were using valmsg-replace, get the underlying error
                .removeData("unobtrusiveContainer");
    }

    function validationInfo(form) {
        var $form = $(form),
            result = $form.data(data_validation),
            onResetProxy = $.proxy(onReset, form);

        if (!result) {
            result = {
                options: {  // options structure passed to jQuery Validate's validate() method
                    errorClass: "input-validation-error",
                    errorElement: "span",
                    errorPlacement: $.proxy(onError, form),
                    invalidHandler: $.proxy(onErrors, form),
                    messages: {},
                    rules: {},
                    success: $.proxy(onSuccess, form)
                },
                attachValidation: function () {
                    $form
                        .unbind("reset." + data_validation, onResetProxy)
                        .bind("reset." + data_validation, onResetProxy)
                        .validate(this.options);
                },
                validate: function () {  // a validation function that is called by unobtrusive Ajax
                    $form.validate();
                    return $form.valid();
                }
            };
            $form.data(data_validation, result);
        }

        return result;
    }

    $jQval.unobtrusive = {
        adapters: [],

        parseElement: function (element, skipAttach) {
            /// <summary>
            /// Parses a single HTML element for unobtrusive validation attributes.
            /// </summary>
            /// <param name="element" domElement="true">The HTML element to be parsed.</param>
            /// <param name="skipAttach" type="Boolean">[Optional] true to skip attaching the
            /// validation to the form. If parsing just this single element, you should specify true.
            /// If parsing several elements, you should specify false, and manually attach the validation
            /// to the form when you are finished. The default is false.</param>
            var $element = $(element),
                form = $element.parents("form")[0],
                valInfo, rules, messages;

            if (!form) {  // Cannot do client-side validation without a form
                return;
            }

            valInfo = validationInfo(form);
            valInfo.options.rules[element.name] = rules = {};
            valInfo.options.messages[element.name] = messages = {};

            $.each(this.adapters, function () {
                var prefix = "data-val-" + this.name,
                    message = $element.attr(prefix),
                    paramValues = {};

                if (message !== undefined) {  // Compare against undefined, because an empty message is legal (and falsy)
                    prefix += "-";

                    $.each(this.params, function () {
                        paramValues[this] = $element.attr(prefix + this);
                    });

                    this.adapt({
                        element: element,
                        form: form,
                        message: message,
                        params: paramValues,
                        rules: rules,
                        messages: messages
                    });
                }
            });

            $.extend(rules, { "__dummy__": true });

            if (!skipAttach) {
                valInfo.attachValidation();
            }
        },

        parse: function (selector) {
            /// <summary>
            /// Parses all the HTML elements in the specified selector. It looks for input elements decorated
            /// with the [data-val=true] attribute value and enables validation according to the data-val-*
            /// attribute values.
            /// </summary>
            /// <param name="selector" type="String">Any valid jQuery selector.</param>
            var $forms = $(selector)
                .parents("form")
                .andSelf()
                .add($(selector).find("form"))
                .filter("form");

            $(selector).find(":input[data-val=true]").each(function () {
                $jQval.unobtrusive.parseElement(this, true);
            });

            $forms.each(function () {
                var info = validationInfo(this);
                if (info) {
                    info.attachValidation();
                }
            });
        }
    };

    adapters = $jQval.unobtrusive.adapters;

    adapters.add = function (adapterName, params, fn) {
        /// <summary>Adds a new adapter to convert unobtrusive HTML into a jQuery Validate validation.</summary>
        /// <param name="adapterName" type="String">The name of the adapter to be added. This matches the name used
        /// in the data-val-nnnn HTML attribute (where nnnn is the adapter name).</param>
        /// <param name="params" type="Array" optional="true">[Optional] An array of parameter names (strings) that will
        /// be extracted from the data-val-nnnn-mmmm HTML attributes (where nnnn is the adapter name, and
        /// mmmm is the parameter name).</param>
        /// <param name="fn" type="Function">The function to call, which adapts the values from the HTML
        /// attributes into jQuery Validate rules and/or messages.</param>
        /// <returns type="jQuery.validator.unobtrusive.adapters" />
        if (!fn) {  // Called with no params, just a function
            fn = params;
            params = [];
        }
        this.push({ name: adapterName, params: params, adapt: fn });
        return this;
    };

    adapters.addBool = function (adapterName, ruleName) {
        /// <summary>Adds a new adapter to convert unobtrusive HTML into a jQuery Validate validation, where
        /// the jQuery Validate validation rule has no parameter values.</summary>
        /// <param name="adapterName" type="String">The name of the adapter to be added. This matches the name used
        /// in the data-val-nnnn HTML attribute (where nnnn is the adapter name).</param>
        /// <param name="ruleName" type="String" optional="true">[Optional] The name of the jQuery Validate rule. If not provided, the value
        /// of adapterName will be used instead.</param>
        /// <returns type="jQuery.validator.unobtrusive.adapters" />
        return this.add(adapterName, function (options) {
            setValidationValues(options, ruleName || adapterName, true);
        });
    };

    adapters.addMinMax = function (adapterName, minRuleName, maxRuleName, minMaxRuleName, minAttribute, maxAttribute) {
        /// <summary>Adds a new adapter to convert unobtrusive HTML into a jQuery Validate validation, where
        /// the jQuery Validate validation has three potential rules (one for min-only, one for max-only, and
        /// one for min-and-max). The HTML parameters are expected to be named -min and -max.</summary>
        /// <param name="adapterName" type="String">The name of the adapter to be added. This matches the name used
        /// in the data-val-nnnn HTML attribute (where nnnn is the adapter name).</param>
        /// <param name="minRuleName" type="String">The name of the jQuery Validate rule to be used when you only
        /// have a minimum value.</param>
        /// <param name="maxRuleName" type="String">The name of the jQuery Validate rule to be used when you only
        /// have a maximum value.</param>
        /// <param name="minMaxRuleName" type="String">The name of the jQuery Validate rule to be used when you
        /// have both a minimum and maximum value.</param>
        /// <param name="minAttribute" type="String" optional="true">[Optional] The name of the HTML attribute that
        /// contains the minimum value. The default is "min".</param>
        /// <param name="maxAttribute" type="String" optional="true">[Optional] The name of the HTML attribute that
        /// contains the maximum value. The default is "max".</param>
        /// <returns type="jQuery.validator.unobtrusive.adapters" />
        return this.add(adapterName, [minAttribute || "min", maxAttribute || "max"], function (options) {
            var min = options.params.min,
                max = options.params.max;

            if (min && max) {
                setValidationValues(options, minMaxRuleName, [min, max]);
            }
            else if (min) {
                setValidationValues(options, minRuleName, min);
            }
            else if (max) {
                setValidationValues(options, maxRuleName, max);
            }
        });
    };

    adapters.addSingleVal = function (adapterName, attribute, ruleName) {
        /// <summary>Adds a new adapter to convert unobtrusive HTML into a jQuery Validate validation, where
        /// the jQuery Validate validation rule has a single value.</summary>
        /// <param name="adapterName" type="String">The name of the adapter to be added. This matches the name used
        /// in the data-val-nnnn HTML attribute(where nnnn is the adapter name).</param>
        /// <param name="attribute" type="String">[Optional] The name of the HTML attribute that contains the value.
        /// The default is "val".</param>
        /// <param name="ruleName" type="String" optional="true">[Optional] The name of the jQuery Validate rule. If not provided, the value
        /// of adapterName will be used instead.</param>
        /// <returns type="jQuery.validator.unobtrusive.adapters" />
        return this.add(adapterName, [attribute || "val"], function (options) {
            setValidationValues(options, ruleName || adapterName, options.params[attribute]);
        });
    };

    $jQval.addMethod("__dummy__", function (value, element, params) {
        return true;
    });

    $jQval.addMethod("regex", function (value, element, params) {
        var match;
        if (this.optional(element)) {
            return true;
        }

        match = new RegExp(params).exec(value);
        return (match && (match.index === 0) && (match[0].length === value.length));
    });

    adapters.addSingleVal("accept", "exts").addSingleVal("regex", "pattern");
    adapters.addBool("creditcard").addBool("date").addBool("digits").addBool("email").addBool("number").addBool("url");
    adapters.addMinMax("length", "minlength", "maxlength", "rangelength").addMinMax("range", "min", "max", "range");
    adapters.add("equalto", ["other"], function (options) {
        var prefix = getModelPrefix(options.element.name),
            other = options.params.other,
            fullOtherName = appendModelPrefix(other, prefix),
            element = $(options.form).find(":input[name='" + escapeAttributeValue(fullOtherName) + "']")[0];

        setValidationValues(options, "equalTo", element);
    });
    adapters.add("required", function (options) {
        // jQuery Validate equates "required" with "mandatory" for checkbox elements
        if (options.element.tagName.toUpperCase() !== "INPUT" || options.element.type.toUpperCase() !== "CHECKBOX") {
            setValidationValues(options, "required", true);
        }
    });
    adapters.add("remote", ["url", "type", "additionalfields"], function (options) {
        var value = {
            url: options.params.url,
            type: options.params.type || "GET",
            data: {}
        },
            prefix = getModelPrefix(options.element.name);

        $.each(splitAndTrim(options.params.additionalfields || options.element.name), function (i, fieldName) {
            var paramName = appendModelPrefix(fieldName, prefix);
            value.data[paramName] = function () {
                return $(options.form).find(":input[name='" + escapeAttributeValue(paramName) + "']").val();
            };
        });

        setValidationValues(options, "remote", value);
    });

    $(function () {
        $jQval.unobtrusive.parse(document);
    });
} (jQuery));
// SIG // Begin signature block
// SIG // MIIaeAYJKoZIhvcNAQcCoIIaaTCCGmUCAQExCzAJBgUr
// SIG // DgMCGgUAMGcGCisGAQQBgjcCAQSgWTBXMDIGCisGAQQB
// SIG // gjcCAR4wJAIBAQQQEODJBs441BGiowAQS9NQkAIBAAIB
// SIG // AAIBAAIBAAIBADAhMAkGBSsOAwIaBQAEFNeKene+OfCM
// SIG // OjJmWQCzLkeINQuqoIIVPzCCBKkwggORoAMCAQICEzMA
// SIG // AACIWQ48UR/iamcAAQAAAIgwDQYJKoZIhvcNAQEFBQAw
// SIG // eTELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEjMCEGA1UEAxMaTWlj
// SIG // cm9zb2Z0IENvZGUgU2lnbmluZyBQQ0EwHhcNMTIwNzI2
// SIG // MjA1MDQxWhcNMTMxMDI2MjA1MDQxWjCBgzELMAkGA1UE
// SIG // BhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNV
// SIG // BAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBD
// SIG // b3Jwb3JhdGlvbjENMAsGA1UECxMETU9QUjEeMBwGA1UE
// SIG // AxMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMIIBIjANBgkq
// SIG // hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAs3R00II8h6ea
// SIG // 1I6yBEKAlyUu5EHOk2M2XxPytHiYgMYofsyKE+89N4w7
// SIG // CaDYFMVcXtipHX8BwbOYG1B37P7qfEXPf+EhDsWEyp8P
// SIG // a7MJOLd0xFcevvBIqHla3w6bHJqovMhStQxpj4TOcVV7
// SIG // /wkgv0B3NyEwdFuV33fLoOXBchIGPfLIVWyvwftqFifI
// SIG // 9bNh49nOGw8e9OTNTDRsPkcR5wIrXxR6BAf11z2L22d9
// SIG // Vz41622NAUCNGoeW4g93TIm6OJz7jgKR2yIP5dA2qbg3
// SIG // RdAq/JaNwWBxM6WIsfbCBDCHW8PXL7J5EdiLZWKiihFm
// SIG // XX5/BXpzih96heXNKBDRPQIDAQABo4IBHTCCARkwEwYD
// SIG // VR0lBAwwCgYIKwYBBQUHAwMwHQYDVR0OBBYEFCZbPltd
// SIG // ll/i93eIf15FU1ioLlu4MA4GA1UdDwEB/wQEAwIHgDAf
// SIG // BgNVHSMEGDAWgBTLEejK0rQWWAHJNy4zFha5TJoKHzBW
// SIG // BgNVHR8ETzBNMEugSaBHhkVodHRwOi8vY3JsLm1pY3Jv
// SIG // c29mdC5jb20vcGtpL2NybC9wcm9kdWN0cy9NaWNDb2RT
// SIG // aWdQQ0FfMDgtMzEtMjAxMC5jcmwwWgYIKwYBBQUHAQEE
// SIG // TjBMMEoGCCsGAQUFBzAChj5odHRwOi8vd3d3Lm1pY3Jv
// SIG // c29mdC5jb20vcGtpL2NlcnRzL01pY0NvZFNpZ1BDQV8w
// SIG // OC0zMS0yMDEwLmNydDANBgkqhkiG9w0BAQUFAAOCAQEA
// SIG // D95ASYiR0TE3o0Q4abJqK9SR+2iFrli7HgyPVvqZ18qX
// SIG // J0zohY55aSzkvZY/5XBml5UwZSmtxsqs9Q95qGe/afQP
// SIG // l+MKD7/ulnYpsiLQM8b/i0mtrrL9vyXq7ydQwOsZ+Bpk
// SIG // aqDhF1mv8c/sgaiJ6LHSFAbjam10UmTalpQqXGlrH+0F
// SIG // mRrc6GWqiBsVlRrTpFGW/VWV+GONnxQMsZ5/SgT/w2at
// SIG // Cq+upN5j+vDqw7Oy64fbxTittnPSeGTq7CFbazvWRCL0
// SIG // gVKlK0MpiwyhKnGCQsurG37Upaet9973RprOQznoKlPt
// SIG // z0Dkd4hCv0cW4KU2au+nGo06PTME9iUgIzCCBMMwggOr
// SIG // oAMCAQICEzMAAAArOTJIwbLJSPMAAAAAACswDQYJKoZI
// SIG // hvcNAQEFBQAwdzELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEhMB8G
// SIG // A1UEAxMYTWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBMB4X
// SIG // DTEyMDkwNDIxMTIzNFoXDTEzMTIwNDIxMTIzNFowgbMx
// SIG // CzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9u
// SIG // MRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNy
// SIG // b3NvZnQgQ29ycG9yYXRpb24xDTALBgNVBAsTBE1PUFIx
// SIG // JzAlBgNVBAsTHm5DaXBoZXIgRFNFIEVTTjpDMEY0LTMw
// SIG // ODYtREVGODElMCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUt
// SIG // U3RhbXAgU2VydmljZTCCASIwDQYJKoZIhvcNAQEBBQAD
// SIG // ggEPADCCAQoCggEBAKa2MA4DZa5QWoZrhZ9IoR7JwO5e
// SIG // SQeF4HCWfL65X2JfBibTizm7GCKlLpKt2EuIOhqvm4Ou
// SIG // yF45jMIyexZ47Tc4OvFi+2iCAmjs67tAirH+oSw2YmBw
// SIG // OWBiDvvGGDhvsJLWQA2Apg14izZrhoomFxj/sOtNursp
// SIG // E+ZcSI5wRjYm/jQ1qzTh99rYXOqZfTG3TR9X63zWlQ1m
// SIG // DB4OMhc+LNWAoc7r95iRAtzBX/04gPg5f11kyjdcO1Fb
// SIG // XYVfzh4c+zS+X+UoVXBUnLjsfABVRlsomChWTOHxugkZ
// SIG // loFIKjDI9zMgbOdpw7PUw07PMB431JhS1KkjRbKuXEFJ
// SIG // T7RiaJMCAwEAAaOCAQkwggEFMB0GA1UdDgQWBBSlGDNT
// SIG // P5VgoUMW747Gr9Irup5Y0DAfBgNVHSMEGDAWgBQjNPjZ
// SIG // UkZwCu1A+3b7syuwwzWzDzBUBgNVHR8ETTBLMEmgR6BF
// SIG // hkNodHRwOi8vY3JsLm1pY3Jvc29mdC5jb20vcGtpL2Ny
// SIG // bC9wcm9kdWN0cy9NaWNyb3NvZnRUaW1lU3RhbXBQQ0Eu
// SIG // Y3JsMFgGCCsGAQUFBwEBBEwwSjBIBggrBgEFBQcwAoY8
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3BraS9jZXJ0
// SIG // cy9NaWNyb3NvZnRUaW1lU3RhbXBQQ0EuY3J0MBMGA1Ud
// SIG // JQQMMAoGCCsGAQUFBwMIMA0GCSqGSIb3DQEBBQUAA4IB
// SIG // AQB+zLB75S++51a1z3PbqlLRFjnGtM361/4eZbXnSPOb
// SIG // RogFZmomhl7+h1jcxmOOOID0CEZ8K3OxDr9BqsvHqpSk
// SIG // N/BkOeHF1fnOB86r5CXwaa7URuL+ZjI815fFMiH67hol
// SIG // oF4MQiwRMzqCg/3tHbO+zpGkkSVxuatysJ6v5M8AYolw
// SIG // qbhKUIzuLyJkpajmTWuVLBx57KejMdqQYJCkbv6TAg0/
// SIG // LCQNxmomgVGDShC7dWNEqmkIxgPr4s8L7VY67O9ypwoM
// SIG // 9ADTIrivInKz58ScCyiggMrj4dc5ZjDnRhcY5/qC+lkL
// SIG // eryoDf4c/wOLY7JNEgIjTy2zhYQ74qFH6M8VMIIFvDCC
// SIG // A6SgAwIBAgIKYTMmGgAAAAAAMTANBgkqhkiG9w0BAQUF
// SIG // ADBfMRMwEQYKCZImiZPyLGQBGRYDY29tMRkwFwYKCZIm
// SIG // iZPyLGQBGRYJbWljcm9zb2Z0MS0wKwYDVQQDEyRNaWNy
// SIG // b3NvZnQgUm9vdCBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkw
// SIG // HhcNMTAwODMxMjIxOTMyWhcNMjAwODMxMjIyOTMyWjB5
// SIG // MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3Rv
// SIG // bjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWlj
// SIG // cm9zb2Z0IENvcnBvcmF0aW9uMSMwIQYDVQQDExpNaWNy
// SIG // b3NvZnQgQ29kZSBTaWduaW5nIFBDQTCCASIwDQYJKoZI
// SIG // hvcNAQEBBQADggEPADCCAQoCggEBALJyWVwZMGS/HZpg
// SIG // ICBCmXZTbD4b1m/My/Hqa/6XFhDg3zp0gxq3L6Ay7P/e
// SIG // wkJOI9VyANs1VwqJyq4gSfTwaKxNS42lvXlLcZtHB9r9
// SIG // Jd+ddYjPqnNEf9eB2/O98jakyVxF3K+tPeAoaJcap6Vy
// SIG // c1bxF5Tk/TWUcqDWdl8ed0WDhTgW0HNbBbpnUo2lsmkv
// SIG // 2hkL/pJ0KeJ2L1TdFDBZ+NKNYv3LyV9GMVC5JxPkQDDP
// SIG // cikQKCLHN049oDI9kM2hOAaFXE5WgigqBTK3S9dPY+fS
// SIG // LWLxRT3nrAgA9kahntFbjCZT6HqqSvJGzzc8OJ60d1yl
// SIG // F56NyxGPVjzBrAlfA9MCAwEAAaOCAV4wggFaMA8GA1Ud
// SIG // EwEB/wQFMAMBAf8wHQYDVR0OBBYEFMsR6MrStBZYAck3
// SIG // LjMWFrlMmgofMAsGA1UdDwQEAwIBhjASBgkrBgEEAYI3
// SIG // FQEEBQIDAQABMCMGCSsGAQQBgjcVAgQWBBT90TFO0yaK
// SIG // leGYYDuoMW+mPLzYLTAZBgkrBgEEAYI3FAIEDB4KAFMA
// SIG // dQBiAEMAQTAfBgNVHSMEGDAWgBQOrIJgQFYnl+UlE/wq
// SIG // 4QpTlVnkpDBQBgNVHR8ESTBHMEWgQ6BBhj9odHRwOi8v
// SIG // Y3JsLm1pY3Jvc29mdC5jb20vcGtpL2NybC9wcm9kdWN0
// SIG // cy9taWNyb3NvZnRyb290Y2VydC5jcmwwVAYIKwYBBQUH
// SIG // AQEESDBGMEQGCCsGAQUFBzAChjhodHRwOi8vd3d3Lm1p
// SIG // Y3Jvc29mdC5jb20vcGtpL2NlcnRzL01pY3Jvc29mdFJv
// SIG // b3RDZXJ0LmNydDANBgkqhkiG9w0BAQUFAAOCAgEAWTk+
// SIG // fyZGr+tvQLEytWrrDi9uqEn361917Uw7LddDrQv+y+kt
// SIG // MaMjzHxQmIAhXaw9L0y6oqhWnONwu7i0+Hm1SXL3PupB
// SIG // f8rhDBdpy6WcIC36C1DEVs0t40rSvHDnqA2iA6VW4LiK
// SIG // S1fylUKc8fPv7uOGHzQ8uFaa8FMjhSqkghyT4pQHHfLi
// SIG // TviMocroE6WRTsgb0o9ylSpxbZsa+BzwU9ZnzCL/XB3N
// SIG // ooy9J7J5Y1ZEolHN+emjWFbdmwJFRC9f9Nqu1IIybvyk
// SIG // lRPk62nnqaIsvsgrEA5ljpnb9aL6EiYJZTiU8XofSrvR
// SIG // 4Vbo0HiWGFzJNRZf3ZMdSY4tvq00RBzuEBUaAF3dNVsh
// SIG // zpjHCe6FDoxPbQ4TTj18KUicctHzbMrB7HCjV5JXfZSN
// SIG // oBtIA1r3z6NnCnSlNu0tLxfI5nI3EvRvsTxngvlSso0z
// SIG // FmUeDordEN5k9G/ORtTTF+l5xAS00/ss3x+KnqwK+xMn
// SIG // QK3k+eGpf0a7B2BHZWBATrBC7E7ts3Z52Ao0CW0cgDEf
// SIG // 4g5U3eWh++VHEK1kmP9QFi58vwUheuKVQSdpw5OPlcmN
// SIG // 2Jshrg1cnPCiroZogwxqLbt2awAdlq3yFnv2FoMkuYjP
// SIG // aqhHMS+a3ONxPdcAfmJH0c6IybgY+g5yjcGjPa8CQGr/
// SIG // aZuW4hCoELQ3UAjWwz0wggYHMIID76ADAgECAgphFmg0
// SIG // AAAAAAAcMA0GCSqGSIb3DQEBBQUAMF8xEzARBgoJkiaJ
// SIG // k/IsZAEZFgNjb20xGTAXBgoJkiaJk/IsZAEZFgltaWNy
// SIG // b3NvZnQxLTArBgNVBAMTJE1pY3Jvc29mdCBSb290IENl
// SIG // cnRpZmljYXRlIEF1dGhvcml0eTAeFw0wNzA0MDMxMjUz
// SIG // MDlaFw0yMTA0MDMxMzAzMDlaMHcxCzAJBgNVBAYTAlVT
// SIG // MRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdS
// SIG // ZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9y
// SIG // YXRpb24xITAfBgNVBAMTGE1pY3Jvc29mdCBUaW1lLVN0
// SIG // YW1wIFBDQTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCC
// SIG // AQoCggEBAJ+hbLHf20iSKnxrLhnhveLjxZlRI1Ctzt0Y
// SIG // TiQP7tGn0UytdDAgEesH1VSVFUmUG0KSrphcMCbaAGvo
// SIG // e73siQcP9w4EmPCJzB/LMySHnfL0Zxws/HvniB3q506j
// SIG // ocEjU8qN+kXPCdBer9CwQgSi+aZsk2fXKNxGU7CG0OUo
// SIG // Ri4nrIZPVVIM5AMs+2qQkDBuh/NZMJ36ftaXs+ghl374
// SIG // 0hPzCLdTbVK0RZCfSABKR2YRJylmqJfk0waBSqL5hKcR
// SIG // RxQJgp+E7VV4/gGaHVAIhQAQMEbtt94jRrvELVSfrx54
// SIG // QTF3zJvfO4OToWECtR0Nsfz3m7IBziJLVP/5BcPCIAsC
// SIG // AwEAAaOCAaswggGnMA8GA1UdEwEB/wQFMAMBAf8wHQYD
// SIG // VR0OBBYEFCM0+NlSRnAK7UD7dvuzK7DDNbMPMAsGA1Ud
// SIG // DwQEAwIBhjAQBgkrBgEEAYI3FQEEAwIBADCBmAYDVR0j
// SIG // BIGQMIGNgBQOrIJgQFYnl+UlE/wq4QpTlVnkpKFjpGEw
// SIG // XzETMBEGCgmSJomT8ixkARkWA2NvbTEZMBcGCgmSJomT
// SIG // 8ixkARkWCW1pY3Jvc29mdDEtMCsGA1UEAxMkTWljcm9z
// SIG // b2Z0IFJvb3QgQ2VydGlmaWNhdGUgQXV0aG9yaXR5ghB5
// SIG // rRahSqClrUxzWPQHEy5lMFAGA1UdHwRJMEcwRaBDoEGG
// SIG // P2h0dHA6Ly9jcmwubWljcm9zb2Z0LmNvbS9wa2kvY3Js
// SIG // L3Byb2R1Y3RzL21pY3Jvc29mdHJvb3RjZXJ0LmNybDBU
// SIG // BggrBgEFBQcBAQRIMEYwRAYIKwYBBQUHMAKGOGh0dHA6
// SIG // Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kvY2VydHMvTWlj
// SIG // cm9zb2Z0Um9vdENlcnQuY3J0MBMGA1UdJQQMMAoGCCsG
// SIG // AQUFBwMIMA0GCSqGSIb3DQEBBQUAA4ICAQAQl4rDXANE
// SIG // Nt3ptK132855UU0BsS50cVttDBOrzr57j7gu1BKijG1i
// SIG // uFcCy04gE1CZ3XpA4le7r1iaHOEdAYasu3jyi9DsOwHu
// SIG // 4r6PCgXIjUji8FMV3U+rkuTnjWrVgMHmlPIGL4UD6ZEq
// SIG // JCJw+/b85HiZLg33B+JwvBhOnY5rCnKVuKE5nGctxVEO
// SIG // 6mJcPxaYiyA/4gcaMvnMMUp2MT0rcgvI6nA9/4UKE9/C
// SIG // CmGO8Ne4F+tOi3/FNSteo7/rvH0LQnvUU3Ih7jDKu3hl
// SIG // XFsBFwoUDtLaFJj1PLlmWLMtL+f5hYbMUVbonXCUbKw5
// SIG // TNT2eb+qGHpiKe+imyk0BncaYsk9Hm0fgvALxyy7z0Oz
// SIG // 5fnsfbXjpKh0NbhOxXEjEiZ2CzxSjHFaRkMUvLOzsE1n
// SIG // yJ9C/4B5IYCeFTBm6EISXhrIniIh0EPpK+m79EjMLNTY
// SIG // MoBMJipIJF9a6lbvpt6Znco6b72BJ3QGEe52Ib+bgsEn
// SIG // VLaxaj2JoXZhtG6hE6a/qkfwEm/9ijJssv7fUciMI8lm
// SIG // vZ0dhxJkAj0tr1mPuOQh5bWwymO0eFQF1EEuUKyUsKV4
// SIG // q7OglnUa2ZKHE3UiLzKoCG6gW4wlv6DvhMoh1useT8ma
// SIG // 7kng9wFlb4kLfchpyOZu6qeXzjEp/w7FW1zYTRuh2Pov
// SIG // nj8uVRZryROj/TGCBKUwggShAgEBMIGQMHkxCzAJBgNV
// SIG // BAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYD
// SIG // VQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQg
// SIG // Q29ycG9yYXRpb24xIzAhBgNVBAMTGk1pY3Jvc29mdCBD
// SIG // b2RlIFNpZ25pbmcgUENBAhMzAAAAiFkOPFEf4mpnAAEA
// SIG // AACIMAkGBSsOAwIaBQCggb4wGQYJKoZIhvcNAQkDMQwG
// SIG // CisGAQQBgjcCAQQwHAYKKwYBBAGCNwIBCzEOMAwGCisG
// SIG // AQQBgjcCARUwIwYJKoZIhvcNAQkEMRYEFLIDzYA9x7Vi
// SIG // DH1IETuuenF7y7MoMF4GCisGAQQBgjcCAQwxUDBOoCaA
// SIG // JABNAGkAYwByAG8AcwBvAGYAdAAgAEwAZQBhAHIAbgBp
// SIG // AG4AZ6EkgCJodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20v
// SIG // bGVhcm5pbmcgMA0GCSqGSIb3DQEBAQUABIIBAJuMHbkY
// SIG // /oIJqawQ8qDf/6t8MoZOEKpTDc8BGMLXRsFtUfBhOCGv
// SIG // N6HNMFGwACqqvqQRQBxHCIgiqHte86/MjcOR9vfQAsry
// SIG // Hkh1wxXF61qRWLaJPZt/X9m5DLl5deYSqR7k5YZTBcYG
// SIG // VNYZOcywU7IxGXumqWw2UAhjIqadJvY5vR+NgBy+lQNg
// SIG // j/9bK7YUlmEn5jFBhSLpVJyJGe5J0NCQ1y6ux2Vy/DOn
// SIG // WuGmBdtguEVBT/GNI66nl8IFApkvwMzCGZkOLjhRcG9w
// SIG // 2HkpkiiKxWPXg5lBXax9B3nPUrVq0voInXjuq/FPxkc2
// SIG // sJj6agEvxOynV3gBye6Mlnss1E6hggIoMIICJAYJKoZI
// SIG // hvcNAQkGMYICFTCCAhECAQEwgY4wdzELMAkGA1UEBhMC
// SIG // VVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcT
// SIG // B1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jw
// SIG // b3JhdGlvbjEhMB8GA1UEAxMYTWljcm9zb2Z0IFRpbWUt
// SIG // U3RhbXAgUENBAhMzAAAAKzkySMGyyUjzAAAAAAArMAkG
// SIG // BSsOAwIaBQCgXTAYBgkqhkiG9w0BCQMxCwYJKoZIhvcN
// SIG // AQcBMBwGCSqGSIb3DQEJBTEPFw0xMjEwMDEyMjEwMzRa
// SIG // MCMGCSqGSIb3DQEJBDEWBBS7wfh63dOMnR9x8WltQlwb
// SIG // JTkQyDANBgkqhkiG9w0BAQUFAASCAQCIQGjIa7W5VzSm
// SIG // OkKLTMMPOqE82lGwFQqPM2dCja7mJLp7q6fNM7Fk80VC
// SIG // lUT1KFW5K0KWPM/S2Hn2BuqlW1mG15K0529oVtoCf2u/
// SIG // Jai7/wKsow9O7fO27F9KcBhxIS13PvyzhVsqDv/jx38x
// SIG // ulOa1CauVD7nTEkK3HIFY4kzn3OzDNdliKopwh2qm49o
// SIG // E3+FMjQo/Vjx68N0Et6hym+LS5X/xyGjMtmq0PW/LDOr
// SIG // M/u9eMO+9IyNWJUaO27ktUW4oaT/4kk0u/LtmhsH5QA8
// SIG // drlWL7OWCJ3ZU346ac5E09WFOdNJ4oTSFbPEwlIK04sv
// SIG // FzomIS3bqIaqlMyUOYYm
// SIG // End signature block
