export default function (plop) {
    // Helper to convert "My Sketch Name" to "my-sketch-name"
    plop.setHelper('kebabCase', (text) => {
        return text
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    });

    plop.setGenerator('sketch', {
        description: 'Create a new p5.js sketch',
        prompts: [
            {
                type: 'input',
                name: 'name',
                message: 'Sketch name (e.g., "grid-01" or "pattern-waves"):',
                validate: (input) => {
                    if (!input) return 'Sketch name is required';
                    if (!/^[a-z0-9-]+$/.test(input)) {
                        return 'Name must be lowercase with dashes (e.g., "my-sketch-01")';
                    }
                    return true;
                },
            },
            {
                type: 'input',
                name: 'title',
                message: 'Display title (e.g., "Grid 01"):',
                validate: (input) => (input ? true : 'Title is required'),
            },
            {
                type: 'input',
                name: 'description',
                message: 'Brief description:',
                default: 'A new generative art sketch',
            },
        ],
        actions: [
            {
                type: 'add',
                path: 'src/sketches/{{name}}.ts',
                templateFile: 'plop-templates/sketch.hbs',
            },
            {
                type: 'append',
                path: 'public/.gitkeep',
                template: '// Remember to add thumbnail: public/{{name}}.png',
                skip: () => '(Optional) Add thumbnail image to public/{{name}}.png',
            },
        ],
    });
}