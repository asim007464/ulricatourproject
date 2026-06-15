/**
 * Enix Booking Rental Plugin - Product Calendar Frontend JS
 */
jQuery(document).ready(function($) {
    'use strict';

    $('.enix-calendar-widget').each(function() {
        var $widget = $(this);
        var $title = $widget.find('.enix-cal-month-indicator');
        var $gridBody = $widget.find('.enix-cal-grid-body');
        var $calendarBox = $widget.find('.enix-cal-box');
        var productId = $widget.data('product-id');
        var basePrice = parseFloat($widget.data('base-price')) || 0;
        var currencySym = $widget.data('currency') || '$';

        // Calendar state
        var currentDate = new Date();
        var currentView = 'month'; // 'month', 'week', 'day', 'list'
        var bookedDates = []; // Populated via AJAX

        // Get day names array
        var dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        var monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        // Load booked dates from WooCommerce order items
        function fetchBookings(callback) {
            $.ajax({
                url: enixBookingData.ajax_url,
                type: 'GET',
                dataType: 'json',
                data: {
                    action: 'enix_get_calendar_bookings',
                    product_id: productId
                },
                success: function(response) {
                    if (response.success && response.data.booked_dates) {
                        bookedDates = response.data.booked_dates;
                    }
                    if (callback) callback();
                },
                error: function() {
                    if (callback) callback();
                }
            });
        }

        // Helper: format Date object to YYYY-MM-DD string
        function formatDateStr(date) {
            var d = new Date(date),
                month = '' + (d.getMonth() + 1),
                day = '' + d.getDate(),
                year = d.getFullYear();

            if (month.length < 2) month = '0' + month;
            if (day.length < 2) day = '0' + day;

            return [year, month, day].join('-');
        }

        // Get ISO week day mapping: Mon=0, Tue=1, ..., Sun=6
        function getIsoDay(date) {
            var day = date.getDay(); // Sun=0, Mon=1, ..., Sat=6
            return day === 0 ? 6 : day - 1;
        }

        // Render the calendar depending on active view state
        function renderCalendar() {
            $calendarBox.empty();

            if ('month' === currentView) {
                renderMonthView();
            } else if ('week' === currentView) {
                renderWeekView();
            } else if ('day' === currentView) {
                renderDayView();
            } else if ('list' === currentView) {
                renderListView();
            }
        }

        // Month View Renderer
        function renderMonthView() {
            var year = currentDate.getFullYear();
            var month = currentDate.getMonth();

            // Set label text: e.g. "June 2026"
            $title.text(monthNames[month] + ' ' + year);

            // Generate Month Calendar Grid Table
            var $table = $('<table class="enix-cal-grid"></table>');
            var $thead = $('<thead></thead>');
            var $trHead = $('<tr></tr>');

            // Table headers Mon-Sun
            dayNames.forEach(function(day) {
                $trHead.append('<th>' + day + '</th>');
            });
            $thead.append($trHead);
            $table.append($thead);

            var $tbody = $('<tbody></tbody>');

            // Computation variables
            var firstDay = new Date(year, month, 1);
            var totalDays = new Date(year, month + 1, 0).getDate();
            var prevTotalDays = new Date(year, month, 0).getDate();
            var startOffset = getIsoDay(firstDay); // offset matching Monday-start

            var cells = [];
            var dateToday = new Date();
            dateToday.setHours(0, 0, 0, 0);

            // Fill previous month offset cells
            for (var i = startOffset - 1; i >= 0; i--) {
                var prevDayVal = prevTotalDays - i;
                var prevDate = new Date(year, month - 1, prevDayVal);
                cells.push({
                    date: prevDate,
                    dayNum: prevDayVal,
                    otherMonth: true
                });
            }

            // Fill current month cells
            for (var d = 1; d <= totalDays; d++) {
                var currDate = new Date(year, month, d);
                cells.push({
                    date: currDate,
                    dayNum: d,
                    otherMonth: false
                });
            }

            // Pad out the rest to make complete rows (multiples of 7)
            var totalGridCells = 42; // standard 6-row layout
            if (cells.length <= 35) {
                totalGridCells = 35; // standard 5-row layout if fits
            }
            var nextMonthDay = 1;
            while (cells.length < totalGridCells) {
                var nextDate = new Date(year, month + 1, nextMonthDay);
                cells.push({
                    date: nextDate,
                    dayNum: nextMonthDay,
                    otherMonth: true
                });
                nextMonthDay++;
            }

            // Render grid cells to DOM
            var $tr = $('<tr></tr>');
            cells.forEach(function(cell, index) {
                if (index > 0 && index % 7 === 0) {
                    $tbody.append($tr);
                    $tr = $('<tr></tr>');
                }

                var $td = $('<td class="enix-cal-cell"></td>');
                var formatted = formatDateStr(cell.date);

                $td.attr('data-date', formatted);
                $td.append('<span class="enix-cal-day-num">' + cell.dayNum + '</span>');

                // Append pricing details
                $td.append('<span class="enix-cal-day-price">' + currencySym + basePrice + '</span>');

                if (cell.otherMonth) {
                    $td.addClass('other-month');
                } else {
                    // Check states
                    var isBooked = bookedDates.includes(formatted);
                    var isPast = cell.date.getTime() < dateToday.getTime();

                    if (isBooked) {
                        $td.addClass('booked');
                    } else if (isPast) {
                        $td.addClass('unavailable');
                    } else {
                        $td.addClass('available');
                    }
                }

                $tr.append($td);
            });

            $tbody.append($tr);
            $table.append($tbody);
            $calendarBox.append($table);
        }

        // Week View Renderer
        function renderWeekView() {
            // Find Monday of the current week
            var weekDayOffset = getIsoDay(currentDate);
            var monday = new Date(currentDate);
            monday.setDate(currentDate.getDate() - weekDayOffset);

            var sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            // Format title: e.g. "Jun 1 – Jun 7, 2026"
            var titleText = monthNames[monday.getMonth()].substring(0, 3) + ' ' + monday.getDate() + ' – ';
            if (monday.getMonth() !== sunday.getMonth()) {
                titleText += monthNames[sunday.getMonth()].substring(0, 3) + ' ';
            }
            titleText += sunday.getDate() + ', ' + sunday.getFullYear();
            $title.text(titleText);

            var $table = $('<table class="enix-cal-grid"></table>');
            var $thead = $('<thead></thead>');
            var $trHead = $('<tr></tr>');
            var $trBody = $('<tr></tr>');

            var dateToday = new Date();
            dateToday.setHours(0, 0, 0, 0);

            for (var i = 0; i < 7; i++) {
                var dayDate = new Date(monday);
                dayDate.setDate(monday.getDate() + i);
                var formatted = formatDateStr(dayDate);

                // Header: "Mon 1"
                $trHead.append('<th>' + dayNames[i] + ' ' + dayDate.getDate() + '</th>');

                // Body cell
                var $td = $('<td class="enix-cal-cell"></td>');
                $td.attr('data-date', formatted);
                $td.append('<span class="enix-cal-day-num">' + dayDate.getDate() + '</span>');
                $td.append('<span class="enix-cal-day-price">' + currencySym + basePrice + '</span>');

                var isBooked = bookedDates.includes(formatted);
                var isPast = dayDate.getTime() < dateToday.getTime();

                if (isBooked) {
                    $td.addClass('booked');
                } else if (isPast) {
                    $td.addClass('unavailable');
                } else {
                    $td.addClass('available');
                }

                $trBody.append($td);
            }

            $thead.append($trHead);
            $table.append($thead);
            $table.append($('<tbody></tbody>').append($trBody));
            $calendarBox.append($table);
        }

        // Day View Renderer
        function renderDayView() {
            var year = currentDate.getFullYear();
            var month = currentDate.getMonth();
            var dateVal = currentDate.getDate();
            var dayOfWeek = dayNames[getIsoDay(currentDate)];

            $title.text(dayOfWeek + ', ' + monthNames[month] + ' ' + dateVal + ', ' + year);

            var formatted = formatDateStr(currentDate);
            var isBooked = bookedDates.includes(formatted);
            var dateToday = new Date();
            dateToday.setHours(0, 0, 0, 0);
            var isPast = currentDate.getTime() < dateToday.getTime();

            var statusClass = 'available';
            var statusLabel = 'Available';

            if (isBooked) {
                statusClass = 'booked';
                statusLabel = 'Booked';
            } else if (isPast) {
                statusClass = 'unavailable';
                statusLabel = 'Unavailable (Past Date)';
            }

            var $dayCard = $(
                '<div class="enix-cal-list-item" style="border: 1px solid var(--enix-border); border-radius: 8px; padding: 20px;">' +
                '<div>' +
                '<h3 style="margin: 0 0 8px 0; font-size: 18px;">Daily Details</h3>' +
                '<p style="margin: 0; color: var(--enix-gray-text);">Base Price: <strong>' + currencySym + basePrice + '</strong></p>' +
                '</div>' +
                '<span class="enix-cal-list-status ' + statusClass + '">' + statusLabel + '</span>' +
                '</div>'
            );

            $calendarBox.append($dayCard);
        }

        // List View Renderer (Displays upcoming 15 days list)
        function renderListView() {
            $title.text('Upcoming Bookings List');

            var $list = $('<ul class="enix-cal-list-view"></ul>');
            var dateToday = new Date();
            dateToday.setHours(0, 0, 0, 0);

            for (var i = 0; i < 15; i++) {
                var listDate = new Date(dateToday);
                listDate.setDate(dateToday.getDate() + i);

                var formatted = formatDateStr(listDate);
                var isBooked = bookedDates.includes(formatted);

                var statusClass = 'available';
                var statusLabel = 'Available';

                if (isBooked) {
                    statusClass = 'booked';
                    statusLabel = 'Booked';
                }

                var dayName = dayNames[getIsoDay(listDate)];
                var displayDate = dayName + ', ' + monthNames[listDate.getMonth()].substring(0, 3) + ' ' + listDate.getDate();

                var $item = $(
                    '<li class="enix-cal-list-item">' +
                    '<span class="enix-cal-list-date">' + displayDate + ' - ' + currencySym + basePrice + '</span>' +
                    '<span class="enix-cal-list-status ' + statusClass + '">' + statusLabel + '</span>' +
                    '</li>'
                );

                $list.append($item);
            }

            $calendarBox.append($list);
        }

        // Bind header navigation controls
        $widget.find('.enix-cal-prev').on('click', function() {
            if ('month' === currentView) {
                currentDate.setMonth(currentDate.getMonth() - 1);
            } else if ('week' === currentView) {
                currentDate.setDate(currentDate.getDate() - 7);
            } else if ('day' === currentView) {
                currentDate.setDate(currentDate.getDate() - 1);
            }
            renderCalendar();
        });

        $widget.find('.enix-cal-next').on('click', function() {
            if ('month' === currentView) {
                currentDate.setMonth(currentDate.getMonth() + 1);
            } else if ('week' === currentView) {
                currentDate.setDate(currentDate.getDate() + 7);
            } else if ('day' === currentView) {
                currentDate.setDate(currentDate.getDate() + 1);
            }
            renderCalendar();
        });

        $widget.find('.enix-cal-today').on('click', function() {
            currentDate = new Date();
            renderCalendar();
        });

        // Bind view toggle controls
        $widget.find('.enix-cal-view-toggle').on('click', function() {
            var $this = $(this);
            $widget.find('.enix-cal-view-toggle').removeClass('active');
            $this.addClass('active');

            currentView = $this.data('view');
            renderCalendar();
        });


        // Handle date click: auto-fill booking form pickup/dropoff date inputs
        $calendarBox.on('click', '.enix-cal-cell.available', function() {
            var $cell = $(this);
            var dateStr = $cell.attr('data-date');
            if (!dateStr) return;

            // Visual selection
            $calendarBox.find('.enix-cal-cell.selected').removeClass('selected');
            $cell.addClass('selected');

            // Convert YYYY-MM-DD -> DD-MM-YYYY (flatpickr dateFormat used by form)
            var parts = dateStr.split('-');
            var formatted = parts[2] + '-' + parts[1] + '-' + parts[0];

            // Locate booking form: prefer same product, fall back to first form on page
            var $form = $('.enix-booking-form-widget .enix-bf-form[data-product-id="' + productId + '"]');
            if (!$form.length) {
                $form = $('.enix-booking-form-widget .enix-bf-form').first();
            }
            if (!$form.length) return;

            var $pickup = $form.find('input[name="pickup_date"]');
            var $dropoff = $form.find('input[name="dropoff_date"]');

            function setFlatpickrValue($input, value) {
                if (!$input.length) return;
                var inst = $input[0]._flatpickr;
                if (inst) {
                    inst.setDate(value, true);
                } else {
                    $input.val(value).trigger('change');
                }
            }

            // Ensure a hint banner exists above the calendar
            var $hint = $widget.find('.enix-cal-hint');
            if (!$hint.length) {
                $hint = $('<div class="enix-cal-hint" style="display:none;margin:10px 0;padding:10px 14px;border-radius:6px;background:#fff5ef;color:#c75010;border:1px solid var(--enix-orange,#f26522);font-weight:600;text-align:center;"></div>');
                $calendarBox.before($hint);
            }

            function showHint(msg, type) {
                $hint.text(msg);
                if ('success' === type) {
                    $hint.css({
                        background: '#f0fdf4',
                        color: '#166534',
                        borderColor: '#166534'
                    });
                } else {
                    $hint.css({
                        background: '#fff5ef',
                        color: '#c75010',
                        borderColor: '#f26522'
                    });
                }
                $hint.stop(true, true).fadeIn();
            }

            // If pickup is empty OR already has a date and dropoff is empty -> fill dropoff
            var pickupVal = $pickup.val();
            var dropoffVal = $dropoff.length ? $dropoff.val() : '';

            if (!pickupVal) {
                setFlatpickrValue($pickup, formatted);
                if ($dropoff.length) {
                    showHint('Pick-up Date selected. Now please select a Drop-off Date.', 'info');
                }
            } else if ($dropoff.length && !dropoffVal) {
                // Ensure dropoff >= pickup; if before, treat as new pickup
                var pParts = pickupVal.split('-');
                var pickupDate = new Date(pParts[2], pParts[1] - 1, pParts[0]);
                var clickedDate = new Date(parts[0], parts[1] - 1, parts[2]);
                if (clickedDate < pickupDate) {
                    setFlatpickrValue($pickup, formatted);
                    showHint('Pick-up Date updated. Now please select a Drop-off Date.', 'info');
                } else {
                    setFlatpickrValue($dropoff, formatted);
                    showHint('Drop-off Date selected. You can now submit your booking.', 'success');
                }
            } else {
                // Both filled: reset pickup to clicked date, clear dropoff
                setFlatpickrValue($pickup, formatted);
                if ($dropoff.length) {
                    setFlatpickrValue($dropoff, '');
                    showHint('Pick-up Date selected. Now please select a Drop-off Date.', 'info');
                }
            }

            // Smooth scroll to form for visibility only when both dates are filled
            var bothFilled = $pickup.val() && (!$dropoff.length || $dropoff.val());
            if (bothFilled) {
                var $formWidget = $form.closest('.enix-booking-form-widget');
                if ($formWidget.length && $formWidget.offset()) {
                    $('html, body').animate({
                        scrollTop: $formWidget.offset().top - 80
                    }, 400);
                }
            }
        });


        // Initialize
        fetchBookings(function() {
            renderCalendar();
        });
    });
});