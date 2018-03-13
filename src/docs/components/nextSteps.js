module.exports = links => {
  const renderLink = link => `* [${link.label}](${link.path})\n\n`;

  return `
  ## Next Steps
  
  ${links.map(renderLink).join('')}
  `;
};
