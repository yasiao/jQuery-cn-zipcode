(function ($) {
    'use strict';

    var data = {
        '北京': {
            '北京市': {'东城区': '100011', '西城区': '100032'}
        },
        '河北省': {
            '石家庄市': {'长安区': '050011', '桥西区': '050051'},
            '唐山市': {'路南区': '063017', '路北区': '063015'}
        },
        '内蒙古': {
            '呼和浩特市': {'回民区': '010030', '玉泉区': '010020'},
            '包头市': {'东河区': '014040', '昆都仑区': '014010'}
        }
    };

    /**
     * _hasOwnProperty for compatibility IE
     * @param {Object} obj Object
     * @param {string} property Property name
     * @return {bool}
     * @version 2.4.3
     */
    function _hasOwnProperty(obj, property) {
        try {
            return !window.hasOwnProperty?
                Object.prototype.hasOwnProperty.call(obj, property.toString()):
                obj.hasOwnProperty(property.toString());
        } catch (ignore) {
        }
    }

    function CNzipcode(container, options) {
        var defaults = {
            'provinceTitle': '省',
            'provinceName': 'province',
            'provinceDefault': '',
            'provinceCss': '',
            'countyTitle': '縣市',
            'countyName': 'county',
            'countyDefault': '',
            'countyCss': '',
            'districtTitle': '鄉鎮市區',
            'districtName': 'district',
            'districtDefault': '',
            'districtCss': '',
            'zipcodeName': 'zipcode',
            'zipcodeDefault': '',
            'zipcodeCss': '',

            'onProvinceSelect': null,
            'onCountySelect': null,
            'onDistrictSelect': null,
            'onZipcodeKeyUp': null,

            'readonly': false
        };

        this.container = $(container);
        this.options = $.extend({}, defaults, options);
        this.init();
    }

    CNzipcode.prototype = {
        init: function () {
            var self = this,
                container = self.container,
                options = self.options,
                provinceName = options.provinceName,
                countyName = options.countyName,
                districtName = options.districtName,
                zipcodeName = options.zipcodeName,
                readonly = options.readonly;

            // Elements create
            $('<select/>')
                .attr('name', provinceName)
                .addClass(undefined !== options.provinceCss? options.provinceCss: '')
                .appendTo(container);

            $('<select/>')
                .attr('name', countyName)
                .addClass(undefined !== options.countyCss? options.countyCss: '')
                .appendTo(container);

            $('<select/>')
                .attr('name', districtName)
                .addClass(undefined !== options.districtCss? options.districtCss: '')
                .appendTo(container);

            $('<input/>')
                .attr({'type': 'text', 'name': zipcodeName})
                .prop('readonly', readonly)
                .addClass(undefined !== options.zipcodeCss? options.zipcodeCss: '')
                .appendTo(container);

            self.wrap = {
                'province': container.find('select[name="' + provinceName + '"]:first'),
                'county': container.find('select[name="' + countyName + '"]:first'),
                'district': container.find('select[name="' + districtName + '"]:first'),
                'zipcode': container.find('input[type=text][name="' + zipcodeName + '"]:first')
            };

            // Reset the elements
            self.reset();
            // Elements events binding
            self.bindings();
        },

        reset: function (obj) {
            var self = this,
                wrap = self.wrap,
                province = {},
                list = {
                    'province': '<option value="">' + self.options.provinceTitle + '</option>',
                    'county': '<option value="">' + self.options.countyTitle + '</option>',
                    'district': '<option value="">' + self.options.districtTitle + '</option>'
                },
                tpl = [];

            switch (obj) {
                case 'county':
                    wrap.county.empty().html(list.county);
                    break;
                case 'district':
                    wrap.district.empty().html(list.district);
                    break;
                default:
                    wrap.province.empty().html(list.province);
                    wrap.county.empty().html(list.county);
                    wrap.district.empty().html(list.district);
                    for (province in data) {
                        if (_hasOwnProperty(data, province)) {
                            tpl.push('<option value="' + province + '">' + province + '</option>');
                        }
                    }
                    $(tpl.join('')).appendTo(wrap.province);
                    break;
            }
            wrap.zipcode.val('');
        },

        bindings: function () {
            var self = this,
                options = self.options,
                wrap = self.wrap;

            // province
            wrap.province.on('change', function () {
                var val = $(this).val(),
                    county = {},
                    tpl = [];

                wrap.county.empty();
                wrap.district.empty();

                if (val) {
                    for (county in data[val]) {
                        if (_hasOwnProperty(data[val], county)) {
                            tpl.push('<option value="' + county + '">');
                            tpl.push(county);
                            tpl.push('</option>');
                        }
                    }
                    wrap.county.append(tpl.join('')).trigger('change');
                } else {
                    wrap.province.find('option:first').prop('selected', true);
                    self.reset('county');
                    self.reset('district');
                }

                // Province callback binding
                if ('function' === typeof options.onProvinceSelect) {
                    options.onProvinceSelect.call(this, wrap.province);
                }
            });

            // county
            wrap.county.on('change', function () {
                var val = $(this).val(),
                    district = {},
                    tpl = [];

                wrap.district.empty();

                if (val) {
                    for (district in data[wrap.province.val()][val]) {
                        if (_hasOwnProperty(data[wrap.province.val()][val], district)) {
                            tpl.push('<option value="' + district + '">');
                            tpl.push(district);
                            tpl.push('</option>');
                        }
                    }
                    wrap.district.append(tpl.join('')).trigger('change');
                } else {
                    wrap.county.find('option:first').prop('selected', true);
                    self.reset('district');
                }

                // County callback binding
                if ('function' === typeof options.onCountySelect) {
                    options.onCountySelect.call(this, wrap.county);
                }
            });

            // District
            wrap.district.on('change', function () {
                var val = $(this).val();
                if (wrap.district.val()) {
                    wrap.zipcode.val(data[wrap.province.val()][wrap.county.val()][val]);
                }

                // District callback binding
                if ('function' === typeof options.onDistrictSelect) {
                    options.onDistrictSelect.call(this, wrap.district);
                }
            });

            // Zipcode
            wrap.zipcode.on('keyup blur', function () {
                var obj = $(this);
                obj.val(obj.val().replace(/[^0-9]/g, ''));
                var val = obj.val().toString();

                for (var province in data) {
                    if (!_hasOwnProperty(data, province)) {
                        continue;
                    }

                    for (var county in data[province]) {
                        if (!_hasOwnProperty(data[province], county)) {
                            continue;
                        }

                        for (var district in data[province][county]) {
                            if (!_hasOwnProperty(data[province][county], district)) {
                                continue;
                            }

                            if (val === data[province][county][district]) {
                                wrap.province.val(province).trigger('change');
                                wrap.county.val(county).trigger('change');
                                wrap.district.val(district).trigger('change');
                                break;
                            }
                        }
                    }
                }

                // Zipcode callback binding
                if ('function' === typeof options.onZipcodeKeyUp) {
                    options.onZipcodeKeyUp.call(this, wrap.zipcode);
                }
            });

            // Default value
            if ('undefined' !== typeof options.provinceDefault) {
                self.wrap.province.val(options.provinceDefault).trigger('change');

                if (_hasOwnProperty(data[options.provinceDefault], options.countyDefault)) {
                    self.wrap.county.val(options.countyDefault).trigger('change');

                    if (_hasOwnProperty(data[options.provinceDefault][options.countyDefault], options.districtDefault)) {
                        self.wrap.district.val(options.districtDefault).trigger('change');
                    }
                }
            }

            self.wrap.zipcode.val(options.zipcodeDefault).trigger('blur');
        }
    };

    $.fn.cnzipcode = function (options) {
        return this.each(function () {
            if (!$.data(this, 'cnzipcode')) {
                $.data(this, 'cnzipcode', new CNzipcode(this, options));
            }
        });
    };
})(jQuery);