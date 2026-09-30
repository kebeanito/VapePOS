package vapepos_backend.controller;

import vapepos_backend.entity.Category;
import vapepos_backend.repository.CategoryRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository categoryRepository;

    public CategoryController(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    // GET all categories
    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    // GET category by ID
    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategoryById(
            @PathVariable Long id) {
        return categoryRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // CREATE category
    @PostMapping
    public ResponseEntity<Category> createCategory(
            @RequestBody Category category) {
        if (category.getName() == null ||
                category.getName().trim().isEmpty()) {

            return ResponseEntity.badRequest().build();
        }

        category.setName(category.getName().trim());

        Category savedCategory = categoryRepository.save(category);

        return ResponseEntity.ok(savedCategory);
    }

    // UPDATE category
    @PutMapping("/{id}")
    public ResponseEntity<Category> updateCategory(
            @PathVariable Long id,
            @RequestBody Category category) {
        return categoryRepository.findById(id)
                .map(existingCategory -> {

                    existingCategory.setName(
                            category.getName().trim());

                    return ResponseEntity.ok(
                            categoryRepository.save(existingCategory));

                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE category
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long id) {
        if (!categoryRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        categoryRepository.deleteById(id);

        return ResponseEntity.noContent().build();
    }
}