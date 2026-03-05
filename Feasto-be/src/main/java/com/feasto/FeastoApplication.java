package com.feasto;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class FeastoApplication {

	public static void main(String[] args) {
		SpringApplication.run(FeastoApplication.class, args);
	}

}
