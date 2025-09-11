from setuptools import setup, find_packages

setup(
    name="ai-buyer-assist",
    version="0.1.0",
    description="AI-powered buying trend advisor",
    author="AI Assistant",
    packages=find_packages(),
    install_requires=[
        "pandas>=1.5.0",
        "numpy>=1.20.0",
        "scikit-learn>=1.1.0",
        "matplotlib>=3.5.0",
        "seaborn>=0.11.0",
        "requests>=2.25.0",
        "click>=8.0.0",
    ],
    entry_points={
        "console_scripts": [
            "ai-buyer=ai_buyer_assist.cli:main",
        ],
    },
    python_requires=">=3.8",
)