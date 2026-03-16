@GetMapping("/{commitId}/tree")
public ResponseEntity<?> getFileTree(@PathVariable Long commitId) {
    try {
        List<CommitFile> files = commitService.getCommitFiles(commitId);

        // Строим дерево
        Map<String, Object> tree = buildFileTree(files);

        return ResponseEntity.ok(tree);
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
        ));
    }
}

private Map<String, Object> buildFileTree(List<CommitFile> files) {
    Map<String, Object> root = new HashMap<>();
    root.put("name", "/");
    root.put("type", "directory");
    root.put("children", new ArrayList<>());

    for (CommitFile cf : files) {
        String path = cf.getFilePathInRepo();
        if (path.startsWith("/")) {
            path = path.substring(1);
        }

        String[] parts = path.split("/");
        addToTree(root, parts, 0, cf);
    }

    return root;
}

private void addToTree(Map<String, Object> node, String[] parts, int index, CommitFile cf) {
    if (index >= parts.length) return;

    String current = parts[index];
    List<Map<String, Object>> children = (List<Map<String, Object>>) node.get("children");

    // Ищем существующий узел
    Map<String, Object> child = children.stream()
            .filter(c -> c.get("name").equals(current))
            .findFirst()
            .orElse(null);

    if (child == null) {
        child = new HashMap<>();
        child.put("name", current);
        if (index == parts.length - 1) {
            // Это файл
            child.put("type", "file");
            child.put("fileId", cf.getFile().getId());
            child.put("size", cf.getFile().getFileSize());
        } else {
            // Это папка
            child.put("type", "directory");
            child.put("children", new ArrayList<>());
        }
        children.add(child);
    }

    if (index < parts.length - 1) {
        addToTree(child, parts, index + 1, cf);
    }
}