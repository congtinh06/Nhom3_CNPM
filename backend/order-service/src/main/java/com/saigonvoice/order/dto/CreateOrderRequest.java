package com.saigonvoice.order.dto;

import com.saigonvoice.order.entity.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {

    @NotBlank(message = "Vui lòng nhập tên người nhận")
    @Size(max = 150, message = "Tên người nhận tối đa 150 ký tự")
    private String receiverName;

    @NotBlank(message = "Vui lòng nhập số điện thoại")
    @Pattern(regexp = "^0\\d{9}$", message = "Số điện thoại gồm 10 chữ số và bắt đầu bằng 0")
    private String phone;

    @NotBlank(message = "Vui lòng nhập địa chỉ giao hàng")
    @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự")
    private String address;

    @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự")
    private String note;

    @NotNull(message = "Vui lòng chọn phương thức thanh toán")
    private PaymentMethod paymentMethod;

    @NotEmpty(message = "Đơn hàng phải có ít nhất một sản phẩm")
    @Size(max = 50, message = "Đơn hàng tối đa 50 sản phẩm")
    @Valid
    private List<CreateOrderItemRequest> items;
}
