package com.feasto.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.feasto.dto.PaymentDTO;
import com.feasto.entity.Payment;
import com.feasto.enums.PaymentStatus;
import com.feasto.exception.ResourceNotFoundException;
import com.feasto.mapper.CustomMapper;
import com.feasto.repository.OrderRepository;
import com.feasto.repository.PaymentRepository;

@Service
public class PaymentService {

	@Autowired
	private CustomMapper mapper;

	@Autowired
	private PaymentRepository paymentRepository;

	@Autowired
	private OrderRepository orderRepository;

	public PaymentDTO processPayment(PaymentDTO dto) {
		orderRepository.findById(dto.getOrderId())
				.orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + dto.getOrderId()));
		Payment payment = mapper.toPayment(dto);
		payment.setPaymentStatus(PaymentStatus.COMPLETED); // Simulated processing
		Payment saved = paymentRepository.save(payment);
		return mapper.toPaymentDTO(saved);
	}

	public PaymentDTO getPaymentById(Long id) {
		Payment payment = paymentRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));
		return mapper.toPaymentDTO(payment);
	}
}